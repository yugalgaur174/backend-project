import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { response } from "express"


const registerUser=asyncHandler(async(req, res)=>{
    // res.status(200).json({
    //     message:"ok"
    // })

    //get user details from frontend depends upon the users model
    //validation should be checked like non empty
    //check if user already exists: username, email
    //check for images , check for avatar
    //upload them to cloudinary, avatar
    //create user object- create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return response


    //get user details
    const {fullname, email, username, password}=req.body
    console.log("email: ",email);
    
    // if(fullName===""){
    //     throw new ApiError(400,"fullname is required")
    // }
    if(
        [fullname, email, username, password].some((field)=>
        field?.trim()==="")
    ){
        throw new ApiError(400," All fields are required");
    }


    //checking user existance
    const existedUser=User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    console.log(req.files);
    
    //check for images and avatar
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    //upload them to cloudinary
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    //check avatar upload
    if(!avatar){
        throw new ApiError(400, "Avatar file not uploaded successfully")
    }


    //create user in database
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url||"",
        email,
        password,
        username:username.toLowerCase()
    })


    //check if user is created or not
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"//kya kya nhi chahiye
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    //if user created then give response
    return res.status(201).json(
        new ApiResponse(200,createdUser, "User registered Successfully")
    )

} )




export {registerUser}