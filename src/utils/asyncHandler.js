const asyncHandler= (requestHandler)=>{
    return (req, res,next)=>{
        // Promise.resolve(requestHandler).catch((error)=>next(error))
        Promise.resolve(requestHandler(req, res,next)).catch((error)=>next(error))
    }
}





export {asyncHandler}

// const asyncHandler=()=>{}
// const asyncHandler=(func)=>()=>{}
// const asyncHandler=()=>async()=>{}

// FOR TRY CATCH 
// const asyncHandler=(fn)=>async(req, res ,next)=>{
//     try {
//         await fn(req, res,next);
//     } catch (error) {
//         res.status(error.code||500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }