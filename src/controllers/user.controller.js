import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { response } from "express"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken, refreshToken}
        

    } catch (error) {
        throw new ApiError(500, "Something went wrong while geneating refresh and access token")
    }
}

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
    // console.log("email: ",email);
    
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
    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }
    // console.log(req.files)
    console.log(req.files);
    
    //check for images and avatar
    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
    //or by
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)&&req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }

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

const loginUser= asyncHandler(async(req, res)=>{
    //take data from req body
    //want to give username access or email access
    //find the user
    //if user exist check password
    //access and refresh token
    //send cookies
    const{email, username, password}=req.body

    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required")
    }

    const user= await User.findOne({
        $or:[{email},{username}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    //check password
    const isPasswordValid=await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid User credentials")
    }


    //access and refresh token by making seperate method
    const {accessToken, refreshToken}=await generateAccessAndRefreshTokens(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
    //send to cookies
    const options={
        httpOnly:true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken", refreshToken,options)
    .json(
        new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken}, "User logged in Successfully")
    )
})


const logoutUser=asyncHandler(async(req,res)=>{
    //delete refresh token from db
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new: true
        }
    )

    const options={
        httpOnly:true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"))
    
})


const refreshAccessToken=asyncHandler(async(req, res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
    if(incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken, 
            ACCESS_TOKEN_SECRET
        )
    
        const user=await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
            
        }
    
        if (incomingRefreshToken !==user?.refreshToken) {
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken, newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status
        .cookie("accesToken", accessToken,options)
        .cookie("refreshToken", newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken:newRefreshToken},
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message|| "Invalid refresh token")
    }

})


export {registerUser,loginUser, logoutUser, refreshAccessToken}