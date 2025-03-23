import { init } from './admin';
import { publishMarketData } from './producer';
import { consumeMarketData } from './consumer';

const runApp = async () => {
  try {
    // Initialize Kafka admin (this will create the topic if it doesn't exist)
    await init();
    
    // Start the Kafka producer to fetch and publish market data every minute
    publishMarketData();
    
    // Start the Kafka consumer to listen and process the published market data
    consumeMarketData();
  } catch (error) {
    console.error("Error in running the application:", error);
  }
};

runApp();
