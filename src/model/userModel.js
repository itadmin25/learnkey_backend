const mongoose = require('mongoose'), Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    profilePicture: {
        type: String
    },
    role: {
        type: String,
        enum: [
            "admin",
            "student",
            "teacher"
        ]
    },
    classes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class", 
        }
    ],

    subjects: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
        }
    ],
    isprofileSetup: {
        type: Boolean,
        default: false
    }
    // isActive: {
    //     type: Boolean,
    //     default: true
    // },
    // couponCode: {
    //     type: String
    // },

    // billingAddress: [{
    //     type: billingAddress,
    //     required: false
    // }],
    // accountStatus: {
    //     type: String,
    //     default: "active",
    //     enum: [
    //         "active",
    //         "pending",
    //         "deactive"
    //     ]
    // },
    // tokenUsed: {
    //     type: Boolean
    // },
    // freeTrialUsed: {
    //     type: Boolean,
    //     default: false
    // },
    // newsLetter: {
    //     type: Boolean,
    //     default: false
    // }
}, { timestamps: true });

module.exports = mongoose.model('user', userSchema);