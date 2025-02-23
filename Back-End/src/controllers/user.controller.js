import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken
        user.save({ validateBeforeSave: true });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Failed to generate access and refresh tokens");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if ([name, email, password].some(field => !field?.trim())) {
        throw new ApiError(400, "All fields are required");
    }

    const userExist = await User.findOne({ email });
    if (userExist) {
        throw new ApiError(409, "User already exists");
    }

    const user = await User.create({
        name: name.toLowerCase(),
        email: email.toLowerCase(),
        password
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if ([email, password].some((field) => !field?.trim())) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken._id);

        if (!user) {
            throw new ApiError(401, "User not found");
        }

        if (user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        const options = {
            httpOnly: true,
            secure: true
        };

        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { refreshToken },
            { new: true, validateBeforeSave: true }
        ).select("-password -refreshToken");

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, updatedUser, "Tokens updated successfully"));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}