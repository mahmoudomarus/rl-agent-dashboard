import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, Bot, Upload, Check, MapPin, Home, Camera, Sparkles, X, Plus, Star, AlertCircle, Building, FileText, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Checkbox } from "./ui/checkbox"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Alert, AlertDescription } from "./ui/alert"
import { useApp } from "../contexts/AppContext"
import { uploadMultipleImages } from "../services/imageUpload"

type WizardStep = 'basic-info' | 'details' | 'images' | 'amenities' | 'lease-terms' | 'preview' | 'published'

interface PropertyData {
  title: string
  address: string
  city: string
  state: string
  country: string
  property_type: string
  bedrooms: number
  bathrooms: number
  size_sqft?: number
  annual_rent: number
  security_deposit?: number
  commission_rate: number
  lease_type: string
  furnished_status: string
  minimum_lease_duration: number
  maximum_lease_duration: number
  description: string
  images: string[]
  amenities: string[]
  agent_id?: string
}

// UAE-specific amenities and property types are loaded from the backend via useEffect

export function AddPropertyWizard() {
  const { 
    createProperty, 
    generateAIDescription, 
    getUAEEmirates, 
    getEmirateAreas, 
    getUAEPropertyTypes, 
    getUAEAmenities 
  } = useApp()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic-info')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uaeEmirates, setUAEEmirates] = useState<any[]>([])
  const [availableAreas, setAvailableAreas] = useState<string[]>([])
  const [uaePropertyTypes, setUAEPropertyTypes] = useState<any>({})
  const [uaeAmenities, setUAEAmenities] = useState<string[]>([])
  const [isLoadingAreas, setIsLoadingAreas] = useState(false)
  
  const [propertyData, setPropertyData] = useState<PropertyData>({
    title: '',
    address: '',
    city: '',
    state: '',
    country: 'UAE',
    property_type: '',
    bedrooms: 1,
    bathrooms: 1,
    size_sqft: 800, // Default for UAE market
    annual_rent: 60000, // Default AED 60k/year for UAE market  
    security_deposit: 3000, // Default 5% of annual rent
    commission_rate: 2.5, // Standard 2.5% commission
    lease_type: 'residential',
    furnished_status: 'unfurnished',
    minimum_lease_duration: 12, // 12 months minimum
    maximum_lease_duration: 24, // 24 months maximum
    description: '',
    images: [],
    amenities: [],
    agent_id: undefined
  })

  const steps = [
    { id: 'basic-info', title: 'Basic Info', icon: Building, description: 'Property location & type' },
    { id: 'details', title: 'Details', icon: Home, description: 'Size & specifications' },
    { id: 'images', title: 'Photos', icon: Camera, description: 'Upload images' },
    { id: 'amenities', title: 'Amenities', icon: Sparkles, description: 'Features & facilities' },
    { id: 'lease-terms', title: 'Lease Terms', icon: FileText, description: 'Rent & lease conditions' },
    { id: 'preview', title: 'Preview', icon: Check, description: 'Review & publish' },
  ]

  // Load UAE data on component mount
  useEffect(() => {
    loadUAEData()
  }, [])

  // Load areas when emirate changes
  useEffect(() => {
    if (propertyData.state) {
      loadEmirateAreas(propertyData.state)
    }
  }, [propertyData.state])

  const loadUAEData = async () => {
    try {
      const [emirates, propertyTypes, amenities] = await Promise.all([
        getUAEEmirates(),
        getUAEPropertyTypes(),
        getUAEAmenities()
      ])
      
      setUAEEmirates(emirates)
      setUAEPropertyTypes(propertyTypes)
      setUAEAmenities(amenities)
    } catch (error) {
      console.error('Failed to load UAE data from API, using fallback data:', error)
      
      // Fallback UAE data while API is being deployed
      setUAEEmirates([
        { value: "Dubai", label: "Dubai" },
        { value: "Abu Dhabi", label: "Abu Dhabi" },
        { value: "Sharjah", label: "Sharjah" },
        { value: "Ajman", label: "Ajman" },
        { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
        { value: "Fujairah", label: "Fujairah" },
        { value: "Umm Al Quwain", label: "Umm Al Quwain" }
      ])
      
      setUAEPropertyTypes({
        "apartment": "Apartment",
        "villa": "Villa", 
        "townhouse": "Townhouse",
        "penthouse": "Penthouse",
        "studio": "Studio",
        "duplex": "Duplex",
        "loft": "Loft",
        "compound": "Compound",
        "hotel_apartment": "Hotel Apartment",
        "office": "Office",
        "retail": "Retail Space"
      })
      
      setUAEAmenities([
        "Central Air Conditioning", "Maid's Room", "Driver's Room", "Built-in Wardrobes",
        "Covered Parking", "24/7 Security", "Swimming Pool", "Gym", "Children's Play Area",
        "WiFi", "Kitchen", "Washing Machine", "TV", "Balcony", "Sea View", "City View"
      ])
    }
  }

  const loadEmirateAreas = async (emirate: string) => {
    setIsLoadingAreas(true)
    try {
      const areas = await getEmirateAreas(emirate)
      setAvailableAreas(areas)
    } catch (error) {
      console.error('Failed to load emirate areas from API, using fallback data:', error)
      
      // Fallback areas data while API is being deployed
      const fallbackAreas: Record<string, string[]> = {
        "Dubai": [
          "Downtown Dubai", "Dubai Marina", "Jumeirah Beach Residence (JBR)",
          "Business Bay", "Palm Jumeirah", "Jumeirah", "Arabian Ranches",
          "Dubai Hills Estate", "City Walk", "DIFC", "Al Barsha", "The Greens"
        ],
        "Abu Dhabi": [
          "Abu Dhabi City", "Yas Island", "Saadiyat Island", "Al Reem Island",
          "Khalifa City", "Al Raha", "Masdar City", "Corniche", "Al Maryah Island"
        ],
        "Sharjah": [
          "Sharjah City", "Al Majaz", "Al Nahda", "Al Khan", "Al Qasba"
        ],
        "Ajman": [
          "Ajman City", "Al Nuaimiya", "Al Rashidiya", "Corniche Road"
        ],
        "Ras Al Khaimah": [
          "Ras Al Khaimah City", "Al Hamra", "Al Marjan Island", "Al Rams"
        ],
        "Fujairah": [
          "Fujairah City", "Dibba", "Kalba", "Khor Fakkan"
        ],
        "Umm Al Quwain": [
          "Umm Al Quwain City", "Al Salam City", "Falaj Al Mualla"
        ]
      }
      
      setAvailableAreas(fallbackAreas[emirate] || [])
    } finally {
      setIsLoadingAreas(false)
    }
  }

  const handleEmirateChange = (value: string) => {
    setPropertyData(prev => ({ 
      ...prev, 
      state: value,
      city: '' // Reset city when emirate changes
    }))
    setErrors(prev => ({ ...prev, state: '', city: '' }))
  }

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (step) {
      case 'basic-info':
        if (!propertyData.title.trim()) newErrors.title = 'Property title is required'
        if (!propertyData.address.trim()) newErrors.address = 'Address is required'
        if (!propertyData.city.trim()) newErrors.city = 'City is required'
        if (!propertyData.state.trim()) newErrors.state = 'State is required'
        if (!propertyData.property_type) newErrors.property_type = 'Property type is required'
        break
      case 'details':
        if (propertyData.bedrooms < 0) newErrors.bedrooms = 'Bedrooms cannot be negative'
        if (propertyData.bathrooms < 0) newErrors.bathrooms = 'Bathrooms cannot be negative'
        if (propertyData.size_sqft && propertyData.size_sqft < 100) newErrors.size_sqft = 'Size must be at least 100 sq ft'
        if (!propertyData.lease_type) newErrors.lease_type = 'Lease type is required'
        if (!propertyData.furnished_status) newErrors.furnished_status = 'Furnished status is required'
        break
      case 'lease-terms':
        if (propertyData.annual_rent < 10000) newErrors.annual_rent = 'Annual rent must be at least AED 10,000'
        if (propertyData.annual_rent > 2000000) newErrors.annual_rent = 'Annual rent cannot exceed AED 2,000,000'
        if (propertyData.commission_rate < 0 || propertyData.commission_rate > 10) newErrors.commission_rate = 'Commission rate must be between 0% and 10%'
        if (propertyData.minimum_lease_duration < 3) newErrors.minimum_lease_duration = 'Minimum lease duration must be at least 3 months'
        if (propertyData.maximum_lease_duration > 120) newErrors.maximum_lease_duration = 'Maximum lease duration cannot exceed 120 months'
        if (propertyData.minimum_lease_duration >= propertyData.maximum_lease_duration) newErrors.maximum_lease_duration = 'Maximum lease must be greater than minimum lease'
        if (!propertyData.description.trim()) newErrors.description = 'Description is required'
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const nextIndex = currentStepIndex + 1
      if (nextIndex < steps.length) {
        setCurrentStep(steps[nextIndex].id as WizardStep)
      }
    }
  }

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id as WizardStep)
    }
  }

  const handleImageUpload = async () => {
    // Create a file input element
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'image/*'
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        setIsUploadingImages(true)
        setErrors(prev => ({ ...prev, images: '' }))
        
        try {
          console.log('Starting upload of', files.length, 'files')
          const uploadResults = await uploadMultipleImages(files, 'properties')
          
          const successfulUploads = uploadResults
            .filter(result => result.success && result.url)
            .map(result => result.url!)
          
          const failedUploads = uploadResults.filter(result => !result.success)
          
          if (successfulUploads.length > 0) {
            setPropertyData(prev => ({
              ...prev,
              images: [...prev.images, ...successfulUploads].slice(0, 10) // Limit to 10 images
            }))
            console.log('Successfully uploaded', successfulUploads.length, 'images')
          }
          
          if (failedUploads.length > 0) {
            const errorMsg = `Failed to upload ${failedUploads.length} image(s). ${failedUploads[0]?.error || 'Unknown error'}`
            setErrors(prev => ({ ...prev, images: errorMsg }))
            console.error('Upload failures:', failedUploads)
          }
        } catch (error: any) {
          console.error('Upload error:', error)
          setErrors(prev => ({ ...prev, images: 'Failed to upload images. Please try again.' }))
        } finally {
          setIsUploadingImages(false)
        }
      }
    }
    
    input.click()
  }

  const removeImage = (index: number) => {
    setPropertyData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const toggleAmenity = (amenity: string) => {
    setPropertyData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  const generateDescription = async () => {
    setIsGeneratingDescription(true)
    try {
      console.log('Generating AI description with data:', propertyData)
      const description = await generateAIDescription({
        property_type: propertyData.property_type,
        city: propertyData.city,
        state: propertyData.state,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        amenities: propertyData.amenities,
        address: propertyData.address
      })
      console.log('Generated description:', description)
      setPropertyData(prev => ({ ...prev, description }))
    } catch (error: any) {
      console.error('Failed to generate description:', error)
      console.error('Error details:', error.message, error.status)
      // Fallback to a simple description
      const fallbackDescription = `Beautiful ${propertyData.property_type.toLowerCase()} in ${propertyData.city}, ${propertyData.state}. This ${propertyData.bedrooms}-bedroom, ${propertyData.bathrooms}-bathroom property is available for long-term lease. ${propertyData.furnished_status === 'furnished' ? 'Fully furnished and' : ''} Perfect for your new home!`
      setPropertyData(prev => ({ ...prev, description: fallbackDescription }))
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    setErrors({})
    
    try {
      console.log('Publishing property with data:', propertyData)
      
      const propertyPayload = {
        title: propertyData.title,
        address: propertyData.address,
        city: propertyData.city,
        state: propertyData.state,
        country: propertyData.country,
        property_type: propertyData.property_type,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        size_sqft: propertyData.size_sqft,
        annual_rent: propertyData.annual_rent,
        security_deposit: propertyData.security_deposit,
        commission_rate: propertyData.commission_rate,
        lease_type: propertyData.lease_type,
        furnished_status: propertyData.furnished_status,
        minimum_lease_duration: propertyData.minimum_lease_duration,
        maximum_lease_duration: propertyData.maximum_lease_duration,
        description: propertyData.description,
        images: propertyData.images,
        amenities: propertyData.amenities,
        agent_id: propertyData.agent_id
      }

      console.log('Sending payload to backend:', propertyPayload)
      const createdProperty = await createProperty(propertyPayload)
      console.log('Property created successfully:', createdProperty)
      
      if (createdProperty) {
        setCurrentStep('published')
      } else {
        setErrors({ general: 'Failed to create property. Please try again.' })
      }
    } catch (error: any) {
      console.error('Error creating property:', error)
      setErrors({ 
        general: error.message || 'Failed to create property. Please check your connection and try again.' 
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic-info':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's start with the basics</h2>
              <p className="text-gray-600">Tell us about your property</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="title">Property Title *</Label>
                  <Input 
                    id="title"
                    placeholder="e.g., Cozy Downtown Apartment"
                    value={propertyData.title}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, title: e.target.value }))}
                  className={`input-enhanced ${errors.title ? 'border-red-500' : ''}`}
                  />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                  <Input 
                  id="address"
                  placeholder="123 Main Street"
                  value={propertyData.address}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, address: e.target.value }))}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>
              
              <div>
                <Label htmlFor="state">Emirate *</Label>
                <Select value={propertyData.state} onValueChange={handleEmirateChange}>
                  <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select Emirate" />
                    </SelectTrigger>
                    <SelectContent>
                    {uaeEmirates.map((emirate) => (
                      <SelectItem key={emirate.value} value={emirate.value}>
                        {emirate.label}
                      </SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
                {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                </div>
              
              <div>
                <Label htmlFor="city">Area/City *</Label>
                <Select 
                  value={propertyData.city} 
                  onValueChange={(value) => setPropertyData(prev => ({ ...prev, city: value }))}
                  disabled={!propertyData.state || isLoadingAreas}
                >
                  <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                    <SelectValue placeholder={
                      !propertyData.state ? "Select Emirate first" : 
                      isLoadingAreas ? "Loading areas..." : 
                      "Select Area/City"
                    } />
                    </SelectTrigger>
                    <SelectContent>
                    {availableAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
              
              <div>
                <Label htmlFor="country">Country</Label>
                <Select value={propertyData.country} onValueChange={(value) => setPropertyData(prev => ({ ...prev, country: value }))}>
                    <SelectTrigger>
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="UAE">United Arab Emirates 🇦🇪</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              
              <div>
                <Label htmlFor="property_type">Property Type *</Label>
                <Select value={propertyData.property_type} onValueChange={(value) => setPropertyData(prev => ({ ...prev, property_type: value }))}>
                  <SelectTrigger className={errors.property_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                    {Object.entries(uaePropertyTypes).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label as string}
                      </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                {errors.property_type && <p className="text-red-500 text-sm mt-1">{errors.property_type}</p>}
              </div>
            </div>
                </div>
        )

      case 'details':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Details</h2>
              <p className="text-gray-600">Provide accurate property specifications</p>
              </div>
              
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input 
                  id="bedrooms"
                  type="number"
                  min="0"
                  max="10"
                  value={propertyData.bedrooms}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 0 }))}
                  className={errors.bedrooms ? 'border-red-500' : ''}
                />
                {errors.bedrooms && <p className="text-red-500 text-sm mt-1">{errors.bedrooms}</p>}
              </div>
              
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={propertyData.bathrooms}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, bathrooms: parseFloat(e.target.value) || 0 }))}
                  className={errors.bathrooms ? 'border-red-500' : ''}
                />
                {errors.bathrooms && <p className="text-red-500 text-sm mt-1">{errors.bathrooms}</p>}
              </div>
              
              <div>
                <Label htmlFor="size_sqft">Size (sq ft)</Label>
                <Input
                  id="size_sqft"
                  type="number"
                  min="100"
                  max="50000"
                  value={propertyData.size_sqft || ''}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, size_sqft: parseInt(e.target.value) || undefined }))}
                  className={errors.size_sqft ? 'border-red-500' : ''}
                  placeholder="e.g. 1200"
                />
                {errors.size_sqft && <p className="text-red-500 text-sm mt-1">{errors.size_sqft}</p>}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="lease_type">Lease Type *</Label>
                <Select value={propertyData.lease_type} onValueChange={(value) => setPropertyData(prev => ({ ...prev, lease_type: value }))}>
                  <SelectTrigger className={errors.lease_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select lease type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="mixed_use">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
                {errors.lease_type && <p className="text-red-500 text-sm mt-1">{errors.lease_type}</p>}
              </div>

              <div>
                <Label htmlFor="furnished_status">Furnished Status *</Label>
                <Select value={propertyData.furnished_status} onValueChange={(value) => setPropertyData(prev => ({ ...prev, furnished_status: value }))}>
                  <SelectTrigger className={errors.furnished_status ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select furnished status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="furnished">Fully Furnished</SelectItem>
                    <SelectItem value="semi_furnished">Semi Furnished</SelectItem>
                    <SelectItem value="unfurnished">Unfurnished</SelectItem>
                  </SelectContent>
                </Select>
                {errors.furnished_status && <p className="text-red-500 text-sm mt-1">{errors.furnished_status}</p>}
              </div>
            </div>
          </div>
        )

      case 'images':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Photos</h2>
              <p className="text-gray-600">Show off your space with beautiful photos</p>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Photos</h3>
              <p className="text-gray-600 mb-4">Add up to 10 high-quality photos of your property</p>
              <Button onClick={handleImageUpload} size="lg" disabled={isUploadingImages} className="krib-button-primary">
                    <Upload className="h-4 w-4 mr-2" />
                {isUploadingImages ? 'Uploading...' : 'Choose Photos'}
                  </Button>
              {errors.images && <p className="text-red-500 text-sm mt-2">{errors.images}</p>}
                </div>
            
            {propertyData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {propertyData.images.map((image, index) => (
                  <div key={index} className="relative group">
                        <img 
                          src={image} 
                          alt={`Property ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                      </div>
                    ))}
                  </div>
            )}
                </div>
        )

      case 'amenities':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Amenities</h2>
              <p className="text-gray-600">What does your property offer?</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {uaeAmenities.map((amenity) => (
                <div
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    propertyData.amenities.includes(amenity)
                      ? 'border-krib-lime bg-krib-lime-soft text-krib-black'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={propertyData.amenities.includes(amenity)}
                      onChange={() => {}} // Controlled by div onClick
                    />
                    <span className="text-sm font-medium">{amenity}</span>
                  </div>
                  </div>
                ))}
              </div>
          </div>
        )

      case 'lease-terms':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Lease Terms & Pricing</h2>
              <p className="text-gray-600">Set your rental terms and commission structure</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="annual_rent">Annual Rent (AED) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">AED</span>
                  <Input
                    id="annual_rent"
                    type="number"
                    min="10000"
                    max="2000000"
                    value={propertyData.annual_rent}
                    onChange={(e) => {
                      const rent = parseInt(e.target.value) || 10000
                      setPropertyData(prev => ({ 
                        ...prev, 
                        annual_rent: rent,
                        security_deposit: rent * 0.05 // Auto-calculate 5% security deposit
                      }))
                    }}
                    className={`pl-14 text-lg ${errors.annual_rent ? 'border-red-500' : ''}`}
                    placeholder="60000"
                  />
                </div>
                {errors.annual_rent && <p className="text-red-500 text-sm mt-1">{errors.annual_rent}</p>}
                <p className="text-sm text-gray-500 mt-1">Monthly: AED {Math.round(propertyData.annual_rent / 12).toLocaleString()}</p>
              </div>

              <div>
                <Label htmlFor="security_deposit">Security Deposit (AED)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">AED</span>
                  <Input
                    id="security_deposit"
                    type="number"
                    min="0"
                    value={propertyData.security_deposit || ''}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, security_deposit: parseInt(e.target.value) || undefined }))}
                    className={`pl-14 ${errors.security_deposit ? 'border-red-500' : ''}`}
                    placeholder="3000"
                  />
                </div>
                {errors.security_deposit && <p className="text-red-500 text-sm mt-1">{errors.security_deposit}</p>}
                <p className="text-sm text-gray-500 mt-1">Recommended: {Math.round(propertyData.annual_rent * 0.05).toLocaleString()} AED (5%)</p>
              </div>

              <div>
                <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={propertyData.commission_rate}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 2.5 }))}
                  className={errors.commission_rate ? 'border-red-500' : ''}
                  placeholder="2.5"
                />
                {errors.commission_rate && <p className="text-red-500 text-sm mt-1">{errors.commission_rate}</p>}
                <p className="text-sm text-gray-500 mt-1">Annual commission: AED {Math.round(propertyData.annual_rent * (propertyData.commission_rate / 100)).toLocaleString()}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="minimum_lease_duration">Min Lease (months)</Label>
                  <Input
                    id="minimum_lease_duration"
                    type="number"
                    min="3"
                    max="60"
                    value={propertyData.minimum_lease_duration}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, minimum_lease_duration: parseInt(e.target.value) || 12 }))}
                    className={errors.minimum_lease_duration ? 'border-red-500' : ''}
                    placeholder="12"
                  />
                  {errors.minimum_lease_duration && <p className="text-red-500 text-sm mt-1">{errors.minimum_lease_duration}</p>}
                </div>

                <div>
                  <Label htmlFor="maximum_lease_duration">Max Lease (months)</Label>
                  <Input
                    id="maximum_lease_duration"
                    type="number"
                    min="6"
                    max="120"
                    value={propertyData.maximum_lease_duration}
                    onChange={(e) => setPropertyData(prev => ({ ...prev, maximum_lease_duration: parseInt(e.target.value) || 24 }))}
                    className={errors.maximum_lease_duration ? 'border-red-500' : ''}
                    placeholder="24"
                  />
                  {errors.maximum_lease_duration && <p className="text-red-500 text-sm mt-1">{errors.maximum_lease_duration}</p>}
                </div>
              </div>
            </div>
              
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="description">Description</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={generateDescription}
                  disabled={isGeneratingDescription}
                  className="h-10 px-4 rounded-xl border-2 border-krib-lime text-krib-lime hover:bg-krib-lime hover:text-krib-black transition-all duration-200 font-medium shadow-sm hover:shadow-md group"
                >
                  {isGeneratingDescription ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-4 w-4 border-2 border-krib-lime border-t-transparent rounded-full mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Bot className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                      ✨ AI Generate
                    </div>
                  )}
                </Button>
              </div>
              <Textarea
                id="description"
                placeholder="Describe your property..."
                value={propertyData.description}
                onChange={(e) => setPropertyData(prev => ({ ...prev, description: e.target.value }))}
                rows={6}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
          </div>
        )

      case 'preview':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Listing</h2>
              <p className="text-gray-600">Make sure everything looks perfect</p>
            </div>
            
            {errors.general && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}
            
            <Card className="krib-card">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">{propertyData.title}</h3>
                    <p className="text-gray-600">{propertyData.address}, {propertyData.city}, {propertyData.state}</p>
                  </div>
                  
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>{propertyData.bedrooms} bed</span>
                    <span>{propertyData.bathrooms} bath</span>
                    {propertyData.size_sqft && <span>{propertyData.size_sqft} sq ft</span>}
                    <span className="font-bold text-gray-900">AED {propertyData.annual_rent.toLocaleString()}/year</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Monthly Rent:</span>
                      <span className="ml-2 font-medium">AED {Math.round(propertyData.annual_rent / 12).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Security Deposit:</span>
                      <span className="ml-2 font-medium">AED {(propertyData.security_deposit || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Lease Type:</span>
                      <span className="ml-2 font-medium capitalize">{propertyData.lease_type}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Furnished:</span>
                      <span className="ml-2 font-medium capitalize">{propertyData.furnished_status.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Lease Duration:</span>
                      <span className="ml-2 font-medium">{propertyData.minimum_lease_duration}-{propertyData.maximum_lease_duration} months</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Commission:</span>
                      <span className="ml-2 font-medium">{propertyData.commission_rate}% (AED {Math.round(propertyData.annual_rent * (propertyData.commission_rate / 100)).toLocaleString()})</span>
                    </div>
                  </div>
                  
                  {propertyData.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {propertyData.images.slice(0, 3).map((image, index) => (
                        <img 
                          key={index}
                          src={image} 
                          alt={`Property ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                  
                  <p className="text-gray-700">{propertyData.description}</p>
                  
                  {propertyData.amenities.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                        {propertyData.amenities.map((amenity) => (
                        <Badge key={amenity} variant="secondary">{amenity}</Badge>
                      ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'published':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-lime-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-10 w-10 text-lime-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 Property Listed!</h2>
              <p className="text-gray-600">Your property is now available for long-term lease applications.</p>
              </div>
            <div className="space-y-3">
              <Button 
                onClick={() => setCurrentStep('basic-info')} 
                variant="outline"
                className="w-full h-12 rounded-xl border-2 hover:bg-gray-50"
              >
                  Add Another Property
                </Button>
              <Button 
                onClick={() => navigate('/properties')}
                className="w-full h-12 rounded-xl krib-button-primary"
              >
                View My Properties
                </Button>
              </div>
          </div>
        )

      default:
        return null
    }
  }

  if (currentStep === 'published') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        {renderStepContent()}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Property</h1>
        <p className="text-gray-600">Create a professional listing for long-term lease</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                index <= currentStepIndex 
                  ? 'bg-krib-lime text-krib-black' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                <step.icon className="h-5 w-5" />
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 ${
                  index < currentStepIndex ? 'bg-krib-lime' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex]?.description}
          </p>
        </div>
      </div>

      {/* Step Content */}
      <Card className="mb-8 card-elevated">
        <CardContent className="p-8 form-section">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex gap-2">
          {currentStepIndex === steps.length - 1 ? (
            <Button 
              onClick={handlePublish}
              disabled={isPublishing}
              size="lg"
              className="px-8 krib-button-primary"
            >
              {isPublishing ? 'Publishing...' : 'Publish Property'}
            </Button>
          ) : (
            <Button onClick={nextStep} size="lg" className="px-8 krib-button-primary">
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}