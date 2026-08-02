import ApiError from "../utils/apiError.js";


const errorHandler = (err,req,res,next)=>{
  console.log('errorHandler hit, error:', err.message);
  console.log('err stack:', err.stack);
    if(err instanceof ApiError){
        return res.status(err.statusCode).json({
           success:false,
           message:err.message  
        })
    }
    res.status(500).json({
        success:false,
        message:err.message||'Internal Server Error',

    })
}

export default errorHandler;