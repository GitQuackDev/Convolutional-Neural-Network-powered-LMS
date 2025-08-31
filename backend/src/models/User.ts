import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types';

// User interface for Mongoose
interface IUserDocument extends Document {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  googleId?: string;
  isEmailVerified: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
  fullName: string;
}

// User Schema
const userSchema = new Schema<IUserDocument>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function(this: IUserDocument) {
      return !this.googleId; // Password not required for Google OAuth users
    },
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.STUDENT,
    required: true
  },
  googleId: {
    type: String,
    sparse: true, // Allow multiple null values but unique non-null values
    unique: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      if (ret.password) delete ret.password;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function(this: IUserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(this: IUserDocument, next) {
  // Only hash password if it's been modified and exists
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods['comparePassword'] = async function(this: IUserDocument, candidatePassword: string): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Static methods
userSchema.statics['findByEmailWithPassword'] = function(email: string) {
  return this.findOne({ email }).select('+password');
};

userSchema.statics['emailExists'] = async function(email: string): Promise<boolean> {
  const user = await this.findOne({ email });
  return !!user;
};

// Create and export the model
const User = mongoose.model<IUserDocument>('User', userSchema);

export default User;
export { IUserDocument };
