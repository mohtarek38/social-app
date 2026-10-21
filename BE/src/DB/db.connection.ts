import mongoose from 'mongoose';


export async function dbConnection(){
    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(process.env.DB_URL_LOCAL as string);
        console.log("Database Connected!");
    } catch (error) {
        console.log(`Database Connection Error: ${error}`);
    }
}