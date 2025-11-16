// src/api.js (you can create this file)
import axios from 'axios';

const BASE_URL = "https://brand-radar.onrender.com";

export const getBrands = async () => {
    const response = await axios.get(`${BASE_URL}/brands/`);
    return response.data;
};
