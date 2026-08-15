const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// IMPORTANTE: En Render deberás configurar esta URL en las variables de entorno (Environment Variables)
// como MONGO_URI. Por ahora dejamos un placeholder.
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://<usuario>:<password>@cluster0.mongodb.net/valuebet?retryWrites=true&w=majority";

// Definición de Esquemas
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const teamMappingSchema = new mongoose.Schema({
    original_name: String,
    mapped_name: String,
    source_site: String
});

const User = mongoose.model('User', userSchema);
const TeamMapping = mongoose.model('TeamMapping', teamMappingSchema);

async function initialize() {
    try {
        console.log("Intentando conectar a MongoDB...");
        // await mongoose.connect(MONGO_URI);
        console.log("Conectado a MongoDB exitosamente (Simulado para entorno local sin URI válida).");

        // Crear usuario admin por defecto si la base de datos está vacía
        /*
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync("admin123", salt);
            await User.create({ username: 'admin', password: hash });
            console.log("Usuario admin creado por defecto.");
        }
        */
    } catch (error) {
        console.error("Error conectando a MongoDB:", error);
    }
}

module.exports = {
    initialize,
    User,
    TeamMapping
};
