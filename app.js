import express from "express";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// API Endpoints
const GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const PLACES_API_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

// Search Route
app.post("/search", async (req, res) => {
  const placeName = req.body.location;
  console.log("Place Name Received:", placeName); // Log user input

  try {
    // Step 1: Convert place name to latitude/longitude using Geocoding API
    const { data: geocodingData } = await axios.get(GEOCODING_API_URL, {
      params: {
        address: placeName,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });
    console.log("Geocoding API Response:", JSON.stringify(geocodingData, null, 2)); // Log API response

    if (!geocodingData.results.length) {
      console.log("Geocoding API returned no results."); // Log failure case
      return res.render("results", { hospitals: [], message: "Location not found." });
    }

    const { lat, lng } = geocodingData.results[0].geometry.location;
    console.log(`Extracted Location: Latitude: ${lat}, Longitude: ${lng}`); // Log lat/lng

    // Step 2: Find nearby hospitals using the Places API
    const { data: placesData } = await axios.get(PLACES_API_URL, {
      params: {
        location: `${lat},${lng}`,
        radius: 5000, // 5km radius
        type: "hospital",
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });
    console.log("Places API Response:", JSON.stringify(placesData, null, 2)); // Log API response

    const hospitals = placesData.results.map((place) => ({
      name: place.name,
      address: place.vicinity || "Address not available",
      rating: place.rating || "No rating",
      location: place.geometry.location, // Add lat/lng data for maps
    }));
    console.log("Extracted Hospitals:", hospitals); // Log processed hospital data

    res.render("results", { hospitals, message: hospitals.length ? "" : "No hospitals found within the radius." });
  } catch (error) {
    console.error("Error in /search route:", error.message); // Log error message
    console.error("Error Details:", error); // Log full error
    res.render("results", { hospitals: [], message: "An error occurred. Please try again." });
  }
});

// Render Main Page
app.get("/", (req, res) => {
  res.render("index");
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server is running at http://localhost:${PORT}`));