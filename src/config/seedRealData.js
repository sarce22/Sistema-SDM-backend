/**
 * @fileoverview Script para poblar SistemaSDM con datos reales de restaurante:
 * Sedes dinámicas, empleados reales (Chefs, Meseros, Admins), inventarios de cocina y salón
 * (mínimo 10-12 ítems por cada categoría y por cada sede), asignaciones en el tablero Kanban,
 * semanas de propinas y alertas operativas.
 */
const bcrypt = require('bcrypt');
const db = require('./db');

async function poblarDatosReales() {
    console.log('Iniciando carga de datos reales en SistemaSDM...');

    const passwordHash = await bcrypt.hash('123456', 10);

    // 1. Asegurar Sedes Dinámicas
    const [sedesActuales] = await db.execute('SELECT * FROM sedes ORDER BY id ASC');
    let sedeCentroId = 1;
    let sedeNorteId = null;
    let sedeExpressId = null;

    const centro = sedesActuales.find((s) => s.nombre.toLowerCase().includes('centro'));
    if (centro) {
        sedeCentroId = centro.id;
        await db.execute(
            'UPDATE sedes SET nombre = ?, mod_meseras = 1, mod_chef = 1, mod_alertas = 1, mod_propinas = 1, mod_accesos = 1 WHERE id = ?',
            ['Sede Centro', sedeCentroId]
        );
    } else {
        const [res] = await db.execute(
            'INSERT INTO sedes (nombre, mod_meseras, mod_chef, mod_alertas, mod_propinas, mod_accesos) VALUES (?, 1, 1, 1, 1, 1)',
            ['Sede Centro']
        );
        sedeCentroId = res.insertId;
    }

    const norte = sedesActuales.find((s) => s.nombre.toLowerCase().includes('norte'));
    if (norte) {
        sedeNorteId = norte.id;
        await db.execute(
            'UPDATE sedes SET nombre = ?, mod_meseras = 1, mod_chef = 1, mod_alertas = 1, mod_propinas = 1, mod_accesos = 1 WHERE id = ?',
            ['Sede Norte', sedeNorteId]
        );
    } else {
        const [res] = await db.execute(
            'INSERT INTO sedes (nombre, mod_meseras, mod_chef, mod_alertas, mod_propinas, mod_accesos) VALUES (?, 1, 1, 1, 1, 1)',
            ['Sede Norte']
        );
        sedeNorteId = res.insertId;
    }

    const express = sedesActuales.find((s) => s.nombre.toLowerCase().includes('express'));
    if (express) {
        sedeExpressId = express.id;
        await db.execute(
            'UPDATE sedes SET nombre = ?, mod_meseras = 1, mod_chef = 1, mod_alertas = 0, mod_propinas = 0, mod_accesos = 0 WHERE id = ?',
            ['Sede Express Chapinero', sedeExpressId]
        );
    } else {
        const [res] = await db.execute(
            'INSERT INTO sedes (nombre, mod_meseras, mod_chef, mod_alertas, mod_propinas, mod_accesos) VALUES (?, 1, 1, 0, 0, 0)',
            ['Sede Express Chapinero']
        );
        sedeExpressId = res.insertId;
    }

    console.log(`Sedes listas: Centro (#${sedeCentroId}), Norte (#${sedeNorteId}), Express (#${sedeExpressId})`);

    // Actualizar nombres de usuarios existentes para que luzcan reales y profesionales
    await db.execute("UPDATE usuarios SET nombre = 'Sebastián Martínez (Admin)' WHERE usuario = 'admin'");
    await db.execute("UPDATE usuarios SET nombre = 'Carlos Andrés Ramírez', sede_id = ? WHERE usuario = 'chef1'", [sedeCentroId]);
    await db.execute("UPDATE usuarios SET nombre = 'Valentina Ospina', sede_id = ? WHERE usuario = 'mesera1'", [sedeCentroId]);
    await db.execute("UPDATE usuarios SET nombre = 'Camila Andrea Vargas', sede_id = ? WHERE usuario = 'Camila'", [sedeCentroId]);

    // 2. Empleados reales a insertar o actualizar (PIN: 123456)
    const empleadosReales = [
        { usuario: 'diego.cocina', nombre: 'Diego Fernando Herrera', rol: 'Chef', sede_id: sedeCentroId },
        { usuario: 'luisa.cocina', nombre: 'Luisa Fernanda Ríos', rol: 'Chef', sede_id: sedeNorteId },
        { usuario: 'miguel.cocina', nombre: 'Miguel Ángel Castro', rol: 'Chef', sede_id: sedeNorteId },
        { usuario: 'andres.cocina', nombre: 'Andrés Felipe Mora', rol: 'Chef', sede_id: sedeExpressId },
        { usuario: 'santiago.m', nombre: 'Santiago Mejía López', rol: 'Mesera', sede_id: sedeCentroId },
        { usuario: 'daniela.m', nombre: 'Daniela Alejandra Parra', rol: 'Mesera', sede_id: sedeCentroId },
        { usuario: 'mariana.m', nombre: 'Mariana Restrepo Díaz', rol: 'Mesera', sede_id: sedeCentroId },
        { usuario: 'laura.m', nombre: 'Laura Sofía Mendoza', rol: 'Mesera', sede_id: sedeNorteId },
        { usuario: 'mateo.m', nombre: 'Mateo Cano Salazar', rol: 'Mesera', sede_id: sedeNorteId },
        { usuario: 'paula.m', nombre: 'Paula Andrea Quintero', rol: 'Mesera', sede_id: sedeNorteId },
        { usuario: 'nicolas.m', nombre: 'Nicolás Pineda Gómez', rol: 'Mesera', sede_id: sedeNorteId },
        { usuario: 'natalia.m', nombre: 'Natalia Giraldo Vélez', rol: 'Mesera', sede_id: sedeExpressId }
    ];

    for (const emp of empleadosReales) {
        const [existe] = await db.execute('SELECT id FROM usuarios WHERE usuario = ?', [emp.usuario]);
        if (existe.length > 0) {
            await db.execute(
                'UPDATE usuarios SET nombre = ?, rol = ?, sede_id = ? WHERE id = ?',
                [emp.nombre, emp.rol, emp.sede_id, existe[0].id]
            );
        } else {
            await db.execute(
                'INSERT INTO usuarios (usuario, nombre, password, rol, sede_id) VALUES (?, ?, ?, ?, ?)',
                [emp.usuario, emp.nombre, passwordHash, emp.rol, emp.sede_id]
            );
        }
    }

    const [todosUsuarios] = await db.execute('SELECT id, usuario, nombre, rol, sede_id FROM usuarios');
    const getUserId = (username) => todosUsuarios.find((u) => u.usuario === username)?.id || 1;

    // 3. Catálogo Base de Cocina (12 Pescados/Mariscos y 12 Verduras por CADA sede)
    await db.execute('DELETE FROM inventario_chef');

    const catalogoPescados = [
        { nombre: 'Filete de Róbalo Fresco', unidad_medida: 'kg', baseCant: 24.5, alerta: 1 },
        { nombre: 'Salmón Chileno Premium', unidad_medida: 'kg', baseCant: 18.0, alerta: 1 },
        { nombre: 'Camarón Tigre Limpio U15', unidad_medida: 'kg', baseCant: 6.5, alerta: 1 },
        { nombre: 'Pulpo Español Seleccionado', unidad_medida: 'kg', baseCant: 12.0, alerta: 1 },
        { nombre: 'Corvina Blanca Entera', unidad_medida: 'kg', baseCant: 19.5, alerta: 1 },
        { nombre: 'Anillos de Calamar Fresco', unidad_medida: 'kg', baseCant: 14.0, alerta: 1 },
        { nombre: 'Langostinos U12 Enteros', unidad_medida: 'kg', baseCant: 11.5, alerta: 1 },
        { nombre: 'Trucha Arcoíris Deshuesada', unidad_medida: 'unidades', baseCant: 28, alerta: 0 },
        { nombre: 'Tilapia Roja Fresca', unidad_medida: 'unidades', baseCant: 32, alerta: 0 },
        { nombre: 'Mejillones Negros en Concha', unidad_medida: 'kg', baseCant: 9.0, alerta: 1 },
        { nombre: 'Almeja Blanca Limpia', unidad_medida: 'kg', baseCant: 8.5, alerta: 1 },
        { nombre: 'Atún Rojo Aleta Amarilla', unidad_medida: 'kg', baseCant: 13.0, alerta: 1 }
    ];

    const catalogoVerduras = [
        { nombre: 'Cebolla Morada Peruana', unidad_medida: 'kg', baseCant: 34.0, alerta: 1 },
        { nombre: 'Limón Tahití Jugoso Seleccionado', unidad_medida: 'kg', baseCant: 48.0, alerta: 1 },
        { nombre: 'Cilantro Fresco Cimarrón', unidad_medida: 'kg', baseCant: 5.5, alerta: 1 },
        { nombre: 'Aguacate Hass Maduro', unidad_medida: 'unidades', baseCant: 40, alerta: 1 },
        { nombre: 'Ají Amarillo y Rocoto Fresco', unidad_medida: 'kg', baseCant: 7.5, alerta: 1 },
        { nombre: 'Maíz Tierno Choclo Desgranado', unidad_medida: 'kg', baseCant: 22.0, alerta: 1 },
        { nombre: 'Pimentón Rojo Dulce', unidad_medida: 'unidades', baseCant: 30, alerta: 0 },
        { nombre: 'Ajo Pelado Nacional', unidad_medida: 'kg', baseCant: 12.5, alerta: 1 },
        { nombre: 'Lechuga Hidropónica Crespa', unidad_medida: 'unidades', baseCant: 26, alerta: 0 },
        { nombre: 'Jengibre Fresco Lavado', unidad_medida: 'kg', baseCant: 9.5, alerta: 0 },
        { nombre: 'Camote / Batata Amarilla', unidad_medida: 'kg', baseCant: 21.0, alerta: 1 },
        { nombre: 'Apio Verde en Rama', unidad_medida: 'kg', baseCant: 14.0, alerta: 0 }
    ];

    const configuracionSedesChef = [
        { sede_id: sedeCentroId, chef_id: getUserId('chef1'), factor: 1.0 },
        { sede_id: sedeNorteId, chef_id: getUserId('luisa.cocina'), factor: 0.85 },
        { sede_id: sedeExpressId, chef_id: getUserId('andres.cocina'), factor: 0.7 }
    ];

    for (const cfg of configuracionSedesChef) {
        for (const p of catalogoPescados) {
            const cant = p.unidad_medida === 'unidades'
                ? Math.max(4, Math.round(p.baseCant * cfg.factor))
                : Number((p.baseCant * cfg.factor).toFixed(1));
            await db.execute(
                `INSERT INTO inventario_chef (nombre, categoria, cantidad, unidad_medida, alerta_activada, usuario_id, sede_id)
                 VALUES (?, 'Pescados', ?, ?, ?, ?, ?)`,
                [p.nombre, cant, p.unidad_medida, p.alerta, cfg.chef_id, cfg.sede_id]
            );
        }

        for (const v of catalogoVerduras) {
            const cant = v.unidad_medida === 'unidades'
                ? Math.max(5, Math.round(v.baseCant * cfg.factor))
                : Number((v.baseCant * cfg.factor).toFixed(1));
            await db.execute(
                `INSERT INTO inventario_chef (nombre, categoria, cantidad, unidad_medida, alerta_activada, usuario_id, sede_id)
                 VALUES (?, 'Verduras', ?, ?, ?, ?, ?)`,
                [v.nombre, cant, v.unidad_medida, v.alerta, cfg.chef_id, cfg.sede_id]
            );
        }
    }

    // 4. Catálogo Base de Meseras (14 ítems por CADA sede: pulpas de fruta, gaseosas, aguas y cervezas)
    await db.execute('DELETE FROM items_mesera');

    const catalogoMeseras = [
        { nombre: 'Pulpa de Maracuyá Natural', descripcion: 'Paquete congelado x 500g para jugo en agua o leche', baseCant: 28, precio: 7500, alerta: 1 },
        { nombre: 'Pulpa de Mora Seleccionada', descripcion: 'Paquete congelado x 500g fruta 100% natural', baseCant: 32, precio: 7500, alerta: 1 },
        { nombre: 'Pulpa de Mango Tommy', descripcion: 'Paquete congelado x 500g sin azúcar añadida', baseCant: 25, precio: 7500, alerta: 1 },
        { nombre: 'Pulpa de Lulo Fresco', descripcion: 'Paquete congelado x 500g especial para lulada y jugo', baseCant: 18, precio: 8000, alerta: 1 },
        { nombre: 'Pulpa de Guanábana Cremosa', descripcion: 'Paquete congelado x 500g seleccionada', baseCant: 15, precio: 8500, alerta: 1 },
        { nombre: 'Pulpa de Fresa Premium', descripcion: 'Paquete congelado x 500g para jugos y granizados', baseCant: 22, precio: 8000, alerta: 1 },
        { nombre: 'Coca-Cola Original 400ml', descripcion: 'Gaseosa botella personal retornable / PET', baseCant: 48, precio: 5500, alerta: 1 },
        { nombre: 'Coca-Cola Sin Azúcar 400ml', descripcion: 'Gaseosa cero calorías botella 400ml', baseCant: 36, precio: 5500, alerta: 1 },
        { nombre: 'Gaseosa Colombiana 400ml', descripcion: 'Gaseosa sabor kola tradicional Postobón', baseCant: 40, precio: 5000, alerta: 1 },
        { nombre: 'Gaseosa Manzana Postobón 400ml', descripcion: 'Gaseosa sabor manzana botella personal', baseCant: 38, precio: 5000, alerta: 0 },
        { nombre: 'Sprite / Quatro 400ml', descripcion: 'Gaseosa lima-limón y toronja botella personal', baseCant: 30, precio: 5000, alerta: 0 },
        { nombre: 'Agua Cristal Sin Gas 600ml', descripcion: 'Botella de agua natural personal', baseCant: 55, precio: 4000, alerta: 1 },
        { nombre: 'Agua Manantial Con Gas 500ml', descripcion: 'Botella de agua gasificada fría', baseCant: 26, precio: 4500, alerta: 0 },
        { nombre: 'Cerveza Club Colombia Dorada 330ml', descripcion: 'Cerveza lager nacional botella 330ml', baseCant: 42, precio: 8500, alerta: 1 },
        { nombre: 'Cerveza Corona Extra 355ml', descripcion: 'Cerveza importada botella 355ml', baseCant: 8, precio: 12000, alerta: 1 },
        { nombre: 'Crema de Coco para Limonada 500ml', descripcion: 'Base cremosa para preparación de limonada de coco', baseCant: 9, precio: 14500, alerta: 1 }
    ];

    const configuracionSedesMesera = [
        { sede_id: sedeCentroId, user_id: getUserId('Camila'), factor: 1.0 },
        { sede_id: sedeNorteId, user_id: getUserId('laura.m'), factor: 0.9 },
        { sede_id: sedeExpressId, user_id: getUserId('natalia.m'), factor: 0.75 }
    ];

    for (const cfg of configuracionSedesMesera) {
        for (const item of catalogoMeseras) {
            const cant = Math.max(5, Math.round(item.baseCant * cfg.factor));
            await db.execute(
                `INSERT INTO items_mesera (nombre, descripcion, cantidad, precio, alerta_activada, usuario_id, sede_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [item.nombre, item.descripcion, cant, item.precio, item.alerta, cfg.user_id, cfg.sede_id]
            );
        }
    }

    // 5. Configurar Tablero de Asignaciones Diarias (Kanban)
    await db.execute('DELETE FROM asignaciones_diarias');
    const fechaConstante = '2000-01-01';

    const asignacionesReales = [
        // Sede Centro
        { usuario_id: getUserId('chef1'), sede_id: sedeCentroId, fijado: 1, horario: '09:00 AM - 05:30 PM', dias_trabajo: ['Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], dia_libre: 'Lunes' },
        { usuario_id: getUserId('diego.cocina'), sede_id: sedeCentroId, fijado: 0, horario: '12:00 PM - 09:00 PM', dias_trabajo: ['Lun', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], dia_libre: 'Martes' },
        { usuario_id: getUserId('Camila'), sede_id: sedeCentroId, fijado: 1, horario: '10:30 AM - 07:30 PM', dias_trabajo: ['Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], dia_libre: 'Lunes' },
        { usuario_id: getUserId('mesera1'), sede_id: sedeCentroId, fijado: 0, horario: '11:30 AM - 08:30 PM', dias_trabajo: ['Lun', 'Mar', 'Jue', 'Vie', 'Sáb', 'Dom'], dia_libre: 'Miércoles' },
        { usuario_id: getUserId('santiago.m'), sede_id: sedeCentroId, fijado: 0, horario: '01:00 PM - 10:00 PM', dias_trabajo: ['Lun', 'Mar', 'Mié', 'Vie', 'Sáb', 'Dom'], dia_libre: 'Jueves' },
        { usuario_id: getUserId('daniela.m'), sede_id: sedeCentroId, fijado: 0, horario: '11:00 AM - 08:00 PM', dias_trabajo: ['Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], dia_libre: 'Lunes' },

        // Sede Norte
        { usuario_id: getUserId('luisa.cocina'), sede_id: sedeNorteId, fijado: 1, horario: '09:00 AM - 05:30 PM', dias_trabajo: ['Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], dia_libre: 'Lunes' },
        { usuario_id: getUserId('miguel.cocina'), sede_id: sedeNorteId, fijado: 0, horario: '12:30 PM - 09:30 PM', dias_trabajo: ['Lun', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], dia_libre: 'Martes' },
        { usuario_id: getUserId('laura.m'), sede_id: sedeNorteId, fijado: 1, horario: '10:30 AM - 07:30 PM', dias_trabajo: ['Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], dia_libre: 'Lunes' },
        { usuario_id: getUserId('mateo.m'), sede_id: sedeNorteId, fijado: 0, horario: '12:00 PM - 09:00 PM', dias_trabajo: ['Lun', 'Mar', 'Jue', 'Vie', 'Sáb', 'Dom'], dia_libre: 'Miércoles' },
        { usuario_id: getUserId('paula.m'), sede_id: sedeNorteId, fijado: 0, horario: '01:00 PM - 10:00 PM', dias_trabajo: ['Lun', 'Mar', 'Mié', 'Vie', 'Sáb', 'Dom'], dia_libre: 'Jueves' },

        // Sede Express Chapinero
        { usuario_id: getUserId('andres.cocina'), sede_id: sedeExpressId, fijado: 1, horario: '10:00 AM - 07:00 PM', dias_trabajo: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], dia_libre: 'Domingo' },
        { usuario_id: getUserId('natalia.m'), sede_id: sedeExpressId, fijado: 1, horario: '10:30 AM - 07:30 PM', dias_trabajo: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], dia_libre: 'Domingo' },

        // Sin Asignar (Disponibles / Descanso)
        { usuario_id: getUserId('mariana.m'), sede_id: null, fijado: 0, horario: 'En Descanso Hoy', dias_trabajo: ['Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], dia_libre: 'Lunes y Martes' },
        { usuario_id: getUserId('nicolas.m'), sede_id: null, fijado: 0, horario: 'Turno Disponible (11:00 AM - 08:00 PM)', dias_trabajo: ['Mar', 'Jue', 'Vie', 'Sáb', 'Dom'], dia_libre: 'Miércoles' }
    ];

    for (const asig of asignacionesReales) {
        if (asig.usuario_id) {
            await db.execute(
                `INSERT INTO asignaciones_diarias (usuario_id, sede_id, fecha, fijado, horario, dias_trabajo, dia_libre)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    asig.usuario_id,
                    asig.sede_id,
                    fechaConstante,
                    asig.fijado,
                    asig.horario,
                    JSON.stringify(asig.dias_trabajo),
                    asig.dia_libre
                ]
            );
        }
    }

    // 6. Semanas de Propinas y Distribución Individual
    await db.execute('DELETE FROM propinas_distribucion');
    await db.execute('DELETE FROM propinas_semanas');

    const semanasData = [
        {
            fecha_inicio: '2026-10-27',
            fecha_fin: '2026-11-02',
            sede_id: sedeCentroId,
            total_efectivo: 3950000,
            estado: 'Cerrado',
            descuento_cafe: 45000,
            descuentos_meseros: JSON.stringify([{ motivo: 'Copa rota salón', valor: 18000 }]),
            descuentos_cocina: JSON.stringify([]),
            pagadoDefault: 1
        },
        {
            fecha_inicio: '2026-11-03',
            fecha_fin: '2026-11-09',
            sede_id: sedeCentroId,
            total_efectivo: 4480000,
            estado: 'Borrador',
            descuento_cafe: 50000,
            descuentos_meseros: JSON.stringify([]),
            descuentos_cocina: JSON.stringify([]),
            pagadoDefault: 0
        },
        {
            fecha_inicio: '2026-10-27',
            fecha_fin: '2026-11-02',
            sede_id: sedeNorteId,
            total_efectivo: 3280000,
            estado: 'Cerrado',
            descuento_cafe: 40000,
            descuentos_meseros: JSON.stringify([]),
            descuentos_cocina: JSON.stringify([]),
            pagadoDefault: 1
        },
        {
            fecha_inicio: '2026-11-03',
            fecha_fin: '2026-11-09',
            sede_id: sedeNorteId,
            total_efectivo: 3690000,
            estado: 'Borrador',
            descuento_cafe: 40000,
            descuentos_meseros: JSON.stringify([]),
            descuentos_cocina: JSON.stringify([]),
            pagadoDefault: 0
        }
    ];

    for (const sem of semanasData) {
        const [resSem] = await db.execute(
            `INSERT INTO propinas_semanas 
             (fecha_inicio, fecha_fin, sede_id, total_efectivo, incluido_martes, incluido_miercoles, incluido_jueves, incluido_viernes, incluido_sabado, incluido_domingo, incluido_lunes, estado, descuento_cafe, descuentos_meseros, descuentos_cocina)
             VALUES (?, ?, ?, ?, 1, 1, 1, 1, 1, 1, 1, ?, ?, ?, ?)`,
            [
                sem.fecha_inicio,
                sem.fecha_fin,
                sem.sede_id,
                sem.total_efectivo,
                sem.estado,
                sem.descuento_cafe,
                sem.descuentos_meseros,
                sem.descuentos_cocina
            ]
        );
        const idSemana = resSem.insertId;

        const [empleadosSede] = await db.execute(
            "SELECT id, usuario FROM usuarios WHERE rol != 'Admin' AND sede_id = ?",
            [sem.sede_id]
        );

        for (let i = 0; i < empleadosSede.length; i++) {
            const emp = empleadosSede[i];
            const diasArray = i % 3 === 2 ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6];
            await db.execute(
                `INSERT INTO propinas_distribucion (id_semana, id_usuario, dias_trabajados, pagado, dias_seleccionados)
                 VALUES (?, ?, ?, ?, ?)`,
                [idSemana, emp.id, diasArray.length, sem.pagadoDefault, JSON.stringify(diasArray)]
            );
        }
    }

    // 7. Alertas Reales del Sistema
    await db.execute('DELETE FROM alertas');

    const alertasReales = [
        {
            mensaje: '¡Stock Bajo! Quedan 6.50 kg de Camarón Tigre Limpio U15 en Pescados.',
            tipo: 'Inventario',
            leida: 0,
            usuario_id: getUserId('diego.cocina'),
            sede_id: sedeCentroId
        },
        {
            mensaje: '¡Stock Bajo! Quedan 5.50 kg de Cilantro Fresco Cimarrón en Verduras.',
            tipo: 'Inventario',
            leida: 0,
            usuario_id: getUserId('chef1'),
            sede_id: sedeCentroId
        },
        {
            mensaje: '¡Stock Bajo! Quedan 8 unidades de Cerveza Corona Extra 355ml en el stock de Meseras.',
            tipo: 'Inventario',
            leida: 0,
            usuario_id: getUserId('santiago.m'),
            sede_id: sedeCentroId
        },
        {
            mensaje: '¡Stock Bajo! Quedan 9 unidades de Crema de Coco para Limonada 500ml en el stock de Meseras.',
            tipo: 'Inventario',
            leida: 1,
            usuario_id: getUserId('Camila'),
            sede_id: sedeCentroId
        },
        {
            mensaje: '¡Stock Bajo! Quedan 5.50 kg de Camarón Tigre Limpio U15 en Pescados.',
            tipo: 'Inventario',
            leida: 0,
            usuario_id: getUserId('luisa.cocina'),
            sede_id: sedeNorteId
        },
        {
            mensaje: '¡Stock Bajo! Quedan 7 unidades de Cerveza Corona Extra 355ml en el stock de Meseras.',
            tipo: 'Inventario',
            leida: 0,
            usuario_id: getUserId('laura.m'),
            sede_id: sedeNorteId
        }
    ];

    for (const al of alertasReales) {
        await db.execute(
            'INSERT INTO alertas (mensaje, tipo, leida, usuario_id, sede_id) VALUES (?, ?, ?, ?, ?)',
            [al.mensaje, al.tipo, al.leida, al.usuario_id, al.sede_id]
        );
    }

    console.log('¡Base de datos poblada exitosamente con más de 10 ítems por cada inventario y sede!');
}

if (require.main === module) {
    poblarDatosReales()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Error poblando datos:', err);
            process.exit(1);
        });
}

module.exports = poblarDatosReales;
