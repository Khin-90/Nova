const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true }, // URL to the image
});

// Use a virtual 'id' field that maps to '_id'
productSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

// Ensure virtual fields are included in JSON output
productSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Product', productSchema);
