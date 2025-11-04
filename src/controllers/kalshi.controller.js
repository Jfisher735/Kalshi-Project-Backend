import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const KALSHI_BASE_URL = process.env.KALSHI_BASE_URL || 'https://api.elections.kalshi.com/trade-api/v2';

const transformMarketData = (market) => {
    // Calculate probability from last price (convert from cents to percentage)
    const probability = market.last_price ? `${Math.round(market.last_price / 100 * 100)}%` : '0%';
    
    // Calculate ROI (if last_price exists, ROI = (100 - last_price) / last_price * 100)
    const roi = market.last_price && market.last_price > 0 
        ? `${Math.round(((100 - market.last_price) / market.last_price) * 100)}%` 
        : '0%';
    
    // Determine sentiment based on price
    const priceValue = market.last_price || 0;
    const sentiment = priceValue > 50 ? 'Bullish' : priceValue < 50 ? 'Bearish' : 'Neutral';
    
    // Format price as currency
    const price = market.last_price_dollars ? `$${market.last_price_dollars}` : '$0.00';
    
    // Format volume with commas
    const volume = market.volume_24h ? market.volume_24h.toLocaleString() : '0';
    
    return {
        ticker: market.ticker || 'N/A',
        market_name: market.title || 'N/A',
        category: market.category || 'General',
        price: price,
        roi: roi,
        volume: volume,
        probability: probability,
        sentiment: sentiment
    };
};

export const getAllMarkets = async (req, res) => {
    try {
        const { 
            limit = 10, 
            cursor, 
            event_ticker,
            series_ticker,
            max_close_ts,
            min_close_ts,
            status,
            tickers
        } = req.query;

        // Build query parameters
        const queryParams = new URLSearchParams();
        
        if (limit) queryParams.append('limit', limit);
        if (cursor) queryParams.append('cursor', cursor);
        if (event_ticker) queryParams.append('event_ticker', event_ticker);
        if (series_ticker) queryParams.append('series_ticker', series_ticker);
        if (max_close_ts) queryParams.append('max_close_ts', max_close_ts);
        if (min_close_ts) queryParams.append('min_close_ts', min_close_ts);
        if (status) queryParams.append('status', status);
        if (tickers) queryParams.append('tickers', tickers);

        const url = `${KALSHI_BASE_URL}/markets${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await axios.get(url);
        
        // Transform the markets data
        const transformedMarkets = response.data.markets.map(transformMarketData);
        
        res.status(200).json({
            success: true,
            data: {
                cursor: response.data.cursor,
                markets: transformedMarkets
            },
            message: 'Markets fetched successfully'
        });
    } catch (error) {
        console.error('Error fetching markets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch markets',
            error: error.message
        });
    }
};

export const getMarketByTicker = async (req, res) => {
    try {
        const { ticker } = req.params;
        
        if (!ticker) {
            return res.status(400).json({
                success: false,
                message: 'Ticker parameter is required'
            });
        }

        const response = await axios.get(`${KALSHI_BASE_URL}/markets/${ticker}`);
        
        // Transform the market data
        const transformedMarket = transformMarketData(response.data.market);
        
        res.status(200).json({
            success: true,
            data: {
                market: transformedMarket
            },
            message: 'Market fetched successfully'
        });
    } catch (error) {
        console.error('Error fetching market:', error);
        
        if (error.response?.status === 404) {
            return res.status(404).json({
                success: false,
                message: 'Market not found',
                error: 'Market with the specified ticker does not exist'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to fetch market',
            error: error.message
        });
    }
};
