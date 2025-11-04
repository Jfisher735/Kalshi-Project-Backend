import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import sequelize from './config/database.js';
import kalshiRoutes from './routes/kalshi.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.send('PERN backend running with Sequelize ORM 🚀');
});

// Kalshi API routes
app.use('/api/kalshi', kalshiRoutes);

// Connect to DB
// (async () => {
//     try {
//         await sequelize.authenticate();
//         console.log('✅ Database connected successfully (Sequelize)');
//     } catch (error) {
//         console.error('❌ Unable to connect to the database:', error);
//     }
// })();

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
