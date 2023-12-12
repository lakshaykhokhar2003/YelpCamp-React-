const express = require('express')
const router = express.Router()

const multer = require('multer')
const {storage, cloudinary} = require('../cloudinary')
const upload = multer({storage})

const Campgrounds = require('../models/campgroundModel')
const Review = require("../models/reviewModel");


const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN
const geocoder = mbxGeocoding({accessToken: mapboxToken})

router.route('/')
    .get(async (req, res) => {
        try {
            const campgrounds = await Campgrounds.find({});
            res.json({campgrounds});
        } catch (e) {
            console.log("Error in campgrounds: ", e.message)
            res.status(500).json({message: e.message})
        }
    })

router.route('/:id')
    .get(async (req, res) => {
        try {
            const campgrounds = await Campgrounds.findById(req.params.id).populate({
                path: 'reviews', populate: {
                    path: 'author'
                }
            }).populate('author')
            res.json({campgrounds})
        } catch (err) {
            console.log("Error in campgrounds (id): ", err.message)
            res.status(500).json({error: err.message});
        }
    })
    .delete(async (req, res) => {
        const {id} = req.params;
        try {
            const campground = await Campgrounds.findById(id)
            campground.reviews.map(async (review) => {
                await Review.findByIdAndDelete(review)
            })
            for (let filename of campground.images) {
                if (filename.filename.length > 0) {
                    await cloudinary.uploader.destroy(filename.filename)
                }
            }
            await Campgrounds.findByIdAndDelete(id);
            return res.status(200).json({message: 'Successfully deleted campground'});
        } catch (err) {
            console.log("Error in campgrounds (id): ", err.message)
            res.status(500).json({error: err.message});
        }
    })

router.route('/:id/edit')
    .get(async (req, res) => {
        try {
            const campground = await Campgrounds.findById(req.params.id)
            res.json({campground})
        } catch (err) {
            console.log("Error in campgrounds (edit): ", err.message)
            res.status(500).json({error: err.message});
        }
    })
    .post(upload.array('image'), async (req, res) => {
        try {
            const geoData = await geocoder.forwardGeocode({
                query: req.body.location, limit: 1
            }).send()
            const {title, location, price, description} = req.body;
            const campground = await Campgrounds.findByIdAndUpdate(req.params.id, {
                $set: {
                    title, location, price, description
                }
            }, {new: true});
            campground.geometry = geoData.body.features[0].geometry
            const imgs = req.files.map(f => ({url: f.path, filename: f.filename}))
            campground.images.push(...imgs)
            await campground.save()
            // console.log(req.body.deleteImages)
            if (req.body.deleteImages) {
                for (let filename of req.body.deleteImages) {
                    await cloudinary.uploader.destroy(filename)
                }
                await campground.updateOne({$pull: {images: {filename: {$in: req.body.deleteImages}}}})
            }
            return res.status(200).json({message: 'Successfully updated campground'});
        } catch (err) {
            console.log("Error in campgrounds (edit): ", err.message)
            res.status(500).json({error: err.message});
        }
    })

router.route('/new')
    .post(upload.array('image'), async (req, res) => {
        try {
            const geoData = await geocoder.forwardGeocode({
                query: req.body.location, limit: 1
            }).send()
            const campground = new Campgrounds(req.body)
            campground.geometry = geoData.body.features[0].geometry
            campground.images = req.files.map(f => ({url: f.path, filename: f.filename}))
            await campground.save();
            return res.status(200).json({message: 'Successfully created campground', campground});
        } catch (err) {
            console.log("Error in campgrounds (adding new): ", err.message)
            res.status(500).json({error: err.message});
        }
    })

module.exports = router;