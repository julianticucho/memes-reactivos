import mongoose from "mongoose"

export interface UserData {
    id: string
    username: string
    email: string
    passwordHash: string
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const userSchema = new mongoose.Schema<UserData>({
    username: { type: String, required: true, unique: true },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [EMAIL_REGEX, "email inválido"],
    },
    passwordHash: { type: String, required: true },
})

userSchema.set("toJSON", {
    transform: (
        _document,
        returnedObject: {
            id?: string
            _id?: mongoose.Types.ObjectId
            __v?: number
            passwordHash?: string
        },
    ) => {
        returnedObject.id = returnedObject._id?.toString()
        delete returnedObject._id
        delete returnedObject.__v
        delete returnedObject.passwordHash
    },
})

const User = mongoose.model<UserData>("User", userSchema)

export default User
