import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env['DATABASE_URL'];
    
    if (!mongoUri) {
      throw new Error('DATABASE_URL environment variable is not defined');
    }

    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log('🌐 Database URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials

    // MongoDB connection options
    const options = {
      maxPoolSize: 10, // Maximum number of socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      w: 'majority' as const,
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
    };

    console.log('⚙️ Connection options:', options);
    await mongoose.connect(mongoUri, options);

    console.log('✅ MongoDB connection established successfully');

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err: any) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 Mongoose connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('❌ Connection error details:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
    throw error;
  }
};

export default connectDatabase;
