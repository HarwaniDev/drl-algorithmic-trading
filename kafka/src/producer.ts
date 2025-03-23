import { kafka } from './client';
import axios from "axios";
import { config } from "dotenv";

config();

const producer = kafka.producer();

const fetchMarketData = async (symbol: String) => {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.API_KEY}`;
    const response = await axios.get(url);
    return response.data;
};

export const publishMarketData = async () => {
    await producer.connect();
    setInterval(async () => {
        const data = await fetchMarketData("AAPL");
        await producer.send({
            topic: "market-data",
            messages: [{ value: JSON.stringify(data) }],
        });
        console.log("Published market data");
    }, 1000);
};

// publishMarketData();
