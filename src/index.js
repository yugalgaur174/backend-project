// require('dotenv').config({path:'./env'})
// or by 
import dotenv from "dotenv"

import mongoose from "mongoose"; 
import { DB_NAME } from "./constants.js";
import { app } from "./app.js";
import connectDB from "./db/index.js";
// import { path } from "express/lib/application";

dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port: ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MongoDb connection failed ",err);
    
}) 
process.on('uncaughtException', (error) => {
    console.error('Unhandled Exception:', error);
});
// import express from "express";
// const app=express()

// (async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log("ERROR in app: " ,error);
//             throw err;
//         })
        
//         app.listen(process.env.PORT,()=>{
//             console.log("App is running on port: ",process.env.PORT);
//         })
//     }
//     catch(error){
//         console.log("Error:",error);
//         throw error;
//     }
// })()

// OR BY 
// function connectDB(){

// }

// connectDB()