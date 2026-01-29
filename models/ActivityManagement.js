import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  activityCode: {
    type: String,
    required: [true, 'Activity code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Activity code cannot exceed 20 characters']
  },
  activityName: {
    type: String,
    required: [true, 'Activity name is required'],
    trim: true,
    maxlength: [100, 'Activity name cannot exceed 100 characters']
  },
  description: {
    type: String,
    default: '',
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: {
      values: ['pcs', 'Kg','Hr', 'Month', 'Day', 'MD', 'Custom'],
      message: 'Unit must be one of: pcs, Kg, Hr, Month, Day, MD, Custom'
    },
    default: 'pcs'
  },
  customUnit: {
    type: String,
    default: '',
    maxlength: [50, 'Custom unit cannot exceed 50 characters'],
    validate: {
      validator: function(v) {
        // Custom unit is only required if unit is 'Custom'
        if (this.unit === 'Custom') {
          return v && v.trim().length > 0;
        }
        return true;
      },
      message: 'Custom unit is required when unit is "Custom"'
    }
  },
  paymentPerUnit: {
    type: Number,
    required: [true, 'Payment per unit is required'],
    min: [0, 'Payment per unit must be positive or zero'],
    max: [1000000, 'Payment per unit too large']
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive'],
      message: 'Status must be Active or Inactive'
    },
    default: 'Active'
  }
}, {
  timestamps: true
});

// Indexes for better performance
ActivitySchema.index({ activityCode: 1 });
ActivitySchema.index({ status: 1 });
ActivitySchema.index({ activityName: 1 });
ActivitySchema.index({ unit: 1 });

// Pre-save middleware
ActivitySchema.pre('save', function(next) {
  if (this.activityCode) {
    this.activityCode = this.activityCode.toUpperCase().trim();
  }
  if (this.activityName) {
    this.activityName = this.activityName.trim();
  }
  if (this.description) {
    this.description = this.description.trim();
  }
  if (this.customUnit) {
    this.customUnit = this.customUnit.trim();
  }
  
  // Ensure proper formatting
  if (this.unit === 'Custom' && this.customUnit) {
    this.customUnit = this.customUnit.trim();
  }
  
  next();
});

// Virtual for display unit
ActivitySchema.virtual('displayUnit').get(function() {
  return this.unit === 'Custom' ? this.customUnit : this.unit;
});

// Virtual for total cost calculation
ActivitySchema.virtual('calculateTotalCost').get(function() {
  // This would be used with quantity to calculate total cost
  return (quantity) => {
    return this.paymentPerUnit * quantity;
  };
});

// Static method to find active activities
ActivitySchema.statics.findActive = function() {
  return this.find({ status: 'Active' }).sort({ activityName: 1 });
};

// Static method to find by unit type
ActivitySchema.statics.findByUnit = function(unit) {
  return this.find({ unit: unit, status: 'Active' }).sort({ activityName: 1 });
};

// Instance method to get unit display
ActivitySchema.methods.getUnitDisplay = function() {
  if (this.unit === 'Custom' && this.customUnit) {
    return this.customUnit;
  }
  return this.unit;
};

// Instance method to check if activity is billable
ActivitySchema.methods.isBillable = function() {
  return this.paymentPerUnit > 0 && this.status === 'Active';
};

export default mongoose.model('Activity', ActivitySchema, 'activities');