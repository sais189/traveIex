import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Users,
  MapPin,
  Star,
  Calendar,
  Clock,
  Plane,
  CreditCard,
  Check,
  ArrowLeft,
  ChevronDown,
  Gift,
  Shield,
  Camera,
  Mountain,
  Waves,
  TreePine,
  Coffee,
  Heart,
  Sparkles,
  Zap,
  Navigation,
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Crown,
  Compass,
  Anchor,
  Fish,
  Snowflake,
  Wind,
  Castle,
  Sun,
  Grape,
  TreePalm,
  Building,
  Flower2,
  Shell,
  Tag
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCurrency } from "@/components/CurrencyProvider";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

import { RobustImage } from "@/components/ui/robust-image";
import DayByDayItinerary from "@/components/DayByDayItinerary";
import Reviews from "@/components/Reviews";

interface Destination {
  id: number;
  name: string;
  country: string;
  description: string;
  imageUrl: string;
  price: string;
  duration: number;
  rating: string;
  reviewCount: number;
  maxGuests: number;
  features: string[];
  itinerary: any[];
}

const travelClasses = [
  { value: "economy", label: "Economy", price: 0 },
  { value: "business", label: "Business", price: 500 }
];

const upgrades = [
  { id: "priority-boarding", name: "Priority Boarding", price: 50, icon: Plane },
  { id: "extra-luggage", name: "Extra Luggage", price: 75, icon: Gift },
  { id: "travel-insurance", name: "Travel Insurance", price: 100, icon: Shield },
  { id: "airport-transfer", name: "Airport Transfer", price: 120, icon: Plane }
];

export default function EnhancedBooking() {
  const [match, params] = useRoute("/booking/:id");
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { formatPrice, convertPrice, currency } = useCurrency();

  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [guests, setGuests] = useState(2);
  const [travelClass, setTravelClass] = useState("economy");
  const [selectedUpgrades, setSelectedUpgrades] = useState<string[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [activeItineraryDay, setActiveItineraryDay] = useState(1);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [currentScrollStage, setCurrentScrollStage] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const destinationId = params?.id ? parseInt(params.id) : 0;



  // Fetch destination details
  const { data: destination, isLoading } = useQuery({
    queryKey: ['/api/destinations', destinationId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/destinations/${destinationId}`);
      return response.json();
    },
    enabled: !!destinationId,
  });

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book a trip",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, navigate, toast]);

  // Set default dates
  useEffect(() => {
    if (destination) {
      const today = new Date();
      const defaultCheckIn = addDays(today, 7);
      const defaultCheckOut = addDays(defaultCheckIn, destination.duration || 7);
      
      setCheckIn(defaultCheckIn);
      setCheckOut(defaultCheckOut);
    }
  }, [destination]);



  // Scroll tracking for parallax effects and stage progression
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrollY(scrollPosition);
      
      // Calculate scroll stages based on viewport height
      const viewportHeight = window.innerHeight;
      const stage = Math.floor(scrollPosition / (viewportHeight * 0.8));
      setCurrentScrollStage(Math.min(stage, 5)); // Max 5 stages
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Journey stages for timeline progression
  const journeyStages = [
    { id: 0, title: "Journey Begins", description: "Welcome to your adventure" },
    { id: 1, title: "Day-by-Day", description: "Explore your itinerary" },
    { id: 2, title: "Highlights", description: "Key experiences await" },
    { id: 3, title: "Information", description: "Everything you need" },
    { id: 4, title: "Booking", description: "Secure your trip" },
    { id: 5, title: "Complete", description: "Adventure awaits" }
  ];



  // Generate varied images for each day based on destination and day content
  const getVariedImageForDay = (destination: any, day: any, index: number) => {
    const destinationName = destination?.name.toLowerCase() || '';
    const country = destination?.country?.toLowerCase() || '';

    // Country-specific landmark images - authentic locations only
    const imageCollections = {
      // Japan landmarks - famous sites and cultural locations
      tokyo: [
        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80", // Tokyo skyline with Tokyo Tower
        "https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200&q=80", // Kinkaku-ji (Golden Pavilion) Kyoto
        "https://images.unsplash.com/photo-1522637739821-45282d6e14ba?w=1200&q=80", // Cherry blossoms at Ueno Park
        "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=1200&q=80", // Arashiyama Bamboo Grove
        "https://images.unsplash.com/photo-1570459027562-4a916cc6113f?w=1200&q=80", // Mount Fuji from Lake Kawaguchi
        "https://images.unsplash.com/photo-1566639046106-4e5dd0604a93?w=1200&q=80", // Ryoan-ji Temple garden
        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80", // Traditional Japanese architecture
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80", // Sensoji Temple at night
        "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=80", // Meiji Shrine grounds
        "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=1200&q=80", // Shirakawa-go village
        "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=1200&q=80", // Japanese kaiseki cuisine
        "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=1200&q=80", // Tsukiji fish market sushi
        "https://images.unsplash.com/photo-1580654712603-eb43273aff33?w=1200&q=80", // Tea ceremony preparation
        "https://images.unsplash.com/photo-1589952283406-b53dd93b766b?w=1200&q=80", // Traditional tea house
        "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&q=80"  // Shibuya crossing Tokyo
      ],
      
      // Maldives landmarks - authentic tropical paradise locations
      maldives: [
        "https://images.unsplash.com/photo-1590523278191-a0d5cd157735?w=1200&q=80", // Male atoll aerial view
        "https://images.unsplash.com/photo-1582880421648-a8985e2b7e6e?w=1200&q=80", // Conrad Maldives overwater villas
        "https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?w=1200&q=80", // Baa Atoll crystal waters
        "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=1200&q=80", // Hanifaru Bay coral reef
        "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=1200&q=80", // Veligandu Island beach
        "https://images.unsplash.com/photo-1573160103600-9072a5ad3d38?w=1200&q=80", // Resort dining pavilion
        "https://images.unsplash.com/photo-1540206395-68808572332f?w=1200&q=80", // Spa treatment villa
        "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1200&q=80", // Water sports equipment
        "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=1200&q=80", // Indian Ocean sunset
        "https://images.unsplash.com/photo-1537956965359-7573183d1180?w=1200&q=80", // Overwater villa deck
        "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80", // Resort infinity pool
        "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=1200&q=80", // Underwater restaurant Ithaa
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80", // Maldivian marine life
        "https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=1200&q=80", // Seaplane at Male
        "https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?w=1200&q=80"  // Whale shark diving
      ],
      
      // Kenya/Tanzania safari landmarks - specific African locations
      safari: [
        "https://images.unsplash.com/photo-1516205651411-aef33a44f7c2?w=1200&q=80", // Maasai Mara savanna
        "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=1200&q=80", // Serengeti game drive
        "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1200&q=80", // Acacia tree Kenya
        "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&q=80", // Lions in Maasai Mara
        "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1200&q=80", // Elephants Amboseli
        "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=1200&q=80", // Giraffes Samburu
        "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=1200&q=80", // Great Migration Serengeti
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=80", // Cheetah Maasai Mara
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80", // Rhino Ol Pejeta
        "https://images.unsplash.com/photo-1581852017103-68ac65514cf4?w=1200&q=80", // Buffalo Ngorongoro
        "https://images.unsplash.com/photo-1555993539-1732b0258327?w=1200&q=80", // Balloon safari Serengeti
        "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=1200&q=80", // Maasai village
        "https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?w=1200&q=80", // Safari lodge Maasai Mara
        "https://images.unsplash.com/photo-1563592441-6ebc9f07c5e7?w=1200&q=80", // Wildebeest crossing
        "https://images.unsplash.com/photo-1518709268805-4e9042af2ea0?w=1200&q=80"  // Leopard Samburu
      ],

      // Nepal/Himalayas landmarks - authentic mountain locations
      himalayas: [
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80", // Mount Everest from Kala Patthar
        "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=1200&q=80", // Annapurna Circuit trail
        "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&q=80", // Prayer flags Lungta
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&q=80", // Namche Bazaar village
        "https://images.unsplash.com/photo-1571708513618-b2fc5d8e0064?w=1200&q=80", // Hillary Bridge crossing
        "https://images.unsplash.com/photo-1578910901702-94dc5782dc67?w=1200&q=80", // Tengboche Monastery
        "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1200&q=80", // Everest Base Camp
        "https://images.unsplash.com/photo-1464822759844-d150296c5bc3?w=1200&q=80", // Ama Dablam peak sunrise
        "https://images.unsplash.com/photo-1485470733090-0aae1788d5af?w=1200&q=80", // Gokyo Lakes
        "https://images.unsplash.com/photo-1626103849488-3f5ac40c4f90?w=1200&q=80"  // Kathmandu Durbar Square
      ],

      // Brazil/Ecuador Amazon & Galápagos landmarks
      amazon: [
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80", // Amazon rainforest Brazil
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80", // Rio Negro tributary
        "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=1200&q=80", // Macaw parrots Amazon
        "https://images.unsplash.com/photo-1571844307880-751c6d86f3f3?w=1200&q=80", // Canopy walkway Manaus
        "https://images.unsplash.com/photo-1566309460650-4e0ff0c75ba4?w=1200&q=80", // Night sounds rainforest
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=80", // Pink river dolphins
        "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&q=80", // Jaguar Amazon basin
        "https://images.unsplash.com/photo-1629732298425-6b6b1ea44999?w=1200&q=80", // Medicinal plants tour
        "https://images.unsplash.com/photo-1625501715616-d19dfe10dd0d?w=1200&q=80", // Indigenous crafts
        "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=1200&q=80"  // Ribeirinhos village
      ],

      // Galápagos Islands Ecuador landmarks
      galapagos: [
        "https://images.unsplash.com/photo-1540206276207-3af25c08abc4?w=1200&q=80", // Giant tortoise Alcedo
        "https://images.unsplash.com/photo-1522633374897-e13b2395a4b6?w=1200&q=80", // Marine iguanas Fernandina
        "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1200&q=80", // Blue-footed boobies Española
        "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1200&q=80", // Sea lions San Cristóbal
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80", // Volcanic landscape Bartolomé
        "https://images.unsplash.com/photo-1633439932734-5edfbb7a5f7b?w=1200&q=80", // Snorkeling Devil's Crown
        "https://images.unsplash.com/photo-1647123135582-cd97671f31da?w=1200&q=80", // Darwin Research Station
        "https://images.unsplash.com/photo-1632165093188-00a07b0b88b8?w=1200&q=80", // Darwin finches evolution
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=80", // Hammerhead sharks Gordon Rocks
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80"  // Pinnacle Rock Bartolomé
      ],

      // Iceland/Finland Arctic landmarks
      arctic: [
        "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=1200&q=80", // Aurora borealis Iceland
        "https://images.unsplash.com/photo-1541278135-bb115c14c5d5?w=1200&q=80", // Ice Hotel Finland
        "https://images.unsplash.com/photo-1610375229632-e1536be3b3ab?w=1200&q=80", // Lapland tundra
        "https://images.unsplash.com/photo-1612349317150-e3d4b7bb1e8f?w=1200&q=80", // Northern lights Jökulsárlón
        "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=1200&q=80", // Reindeer Lapland
        "https://images.unsplash.com/photo-1611068813222-6df73ac77a31?w=1200&q=80", // Snow activities Rovaniemi
        "https://images.unsplash.com/photo-1647885978144-5b59b3a8defd?w=1200&q=80", // Ice fishing Finland
        "https://images.unsplash.com/photo-1604170044814-ea8fc9074d3a?w=1200&q=80", // Arctic fox habitat
        "https://images.unsplash.com/photo-1612202107036-38bb8e846b9f?w=1200&q=80", // Vatnajökull glacier
        "https://images.unsplash.com/photo-1612807522717-76f56ee0b4de?w=1200&q=80"  // Traditional sauna Finland
      ],

      // European landmarks - various countries
      europe: [
        "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1200&q=80", // Neuschwanstein Castle Germany
        "https://images.unsplash.com/photo-1520637736862-4d197d17c18a?w=1200&q=80", // Rothenburg medieval streets
        "https://images.unsplash.com/photo-1549388604-817d15aa0110?w=1200&q=80", // Tuscany countryside Italy
        "https://images.unsplash.com/photo-1607348874607-c617c69bff9e?w=1200&q=80", // Prague Old Town Square
        "https://images.unsplash.com/photo-1504109586057-7a2ae83d1338?w=1200&q=80", // French cuisine preparation
        "https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?w=1200&q=80", // Cliffs of Moher Ireland
        "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=1200&q=80", // Swiss Alpine village
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80", // Versailles gardens France
        "https://images.unsplash.com/photo-1615544847497-4df54ecf7a63?w=1200&q=80", // Oktoberfest Munich
        "https://images.unsplash.com/photo-1546195643-70ca58e96cda?w=1200&q=80"  // Louvre Museum Paris
      ],

      // Default landmarks - various authentic locations
      default: [
        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80", // Machu Picchu Peru
        "https://images.unsplash.com/photo-1506729623306-b5a934d88b53?w=1200&q=80", // Banff National Park Canada
        "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&q=80", // Redwood Forest California
        "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1200&q=80", // Grand Canyon Arizona
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80", // Great Barrier Reef Australia
        "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1200&q=80", // Victoria Falls Zambia
        "https://images.unsplash.com/photo-1610375229632-e1536be3b3ab?w=1200&q=80", // Patagonia Argentina
        "https://images.unsplash.com/photo-1612349317150-e3d4b7bb1e8f?w=1200&q=80", // Norwegian fjords
        "https://images.unsplash.com/photo-1612202107036-38bb8e846b9f?w=1200&q=80", // Sahara Desert Morocco
        "https://images.unsplash.com/photo-1561155659-78c9ab8d9fcd?w=1200&q=80"  // Great Wall China
      ]
    };

    // Intelligent image selection based on destination characteristics
    const dayTitle = day?.title?.toLowerCase() || '';
    const dayDescription = day?.description?.toLowerCase() || '';
    let selectedCollection = imageCollections.default;
    
    // Match destination types to appropriate image collections
    if (destinationName.includes('tokyo') || destinationName.includes('japan') || country.includes('japan') || destinationName.includes('seoul') || country.includes('korea')) {
      selectedCollection = imageCollections.tokyo;
    } else if (destinationName.includes('maldives') || destinationName.includes('luxury resort') || destinationName.includes('santorini') || country.includes('greece')) {
      selectedCollection = imageCollections.maldives;
    } else if (destinationName.includes('safari') || destinationName.includes('kenya') || country.includes('kenya') || destinationName.includes('wildlife') || destinationName.includes('serengeti') || country.includes('tanzania') || country.includes('madagascar')) {
      selectedCollection = imageCollections.safari;
    } else if (destinationName.includes('himalaya') || destinationName.includes('everest') || destinationName.includes('base camp') || country.includes('nepal') || destinationName.includes('rockies') || country.includes('canada')) {
      selectedCollection = imageCollections.himalayas;
    } else if (destinationName.includes('amazon') || destinationName.includes('rainforest') || country.includes('ecuador') || country.includes('brazil') || country.includes('costa rica')) {
      selectedCollection = imageCollections.amazon;
    } else if (destinationName.includes('galápagos') || destinationName.includes('galapagos')) {
      selectedCollection = imageCollections.galapagos;
    } else if (destinationName.includes('northern lights') || destinationName.includes('finland') || destinationName.includes('lapland') || country.includes('finland') || country.includes('iceland') || destinationName.includes('aurora')) {
      selectedCollection = imageCollections.arctic;
    } else if (destinationName.includes('castle') || destinationName.includes('medieval') || country.includes('ireland') || country.includes('poland') || country.includes('scotland') || destinationName.includes('tuscany') || country.includes('italy')) {
      selectedCollection = imageCollections.europe;
    } else if (destinationName.includes('outback') || country.includes('australia') || destinationName.includes('patagonia') || country.includes('argentina')) {
      selectedCollection = imageCollections.safari; // Use safari for wildlife/adventure destinations
    } else if (destinationName.includes('angkor') || country.includes('cambodia') || destinationName.includes('temple') || destinationName.includes('bagan') || country.includes('myanmar')) {
      selectedCollection = imageCollections.tokyo; // Use Asian cultural collection
    } else if (destinationName.includes('machu picchu') || country.includes('peru') || country.includes('bolivia') || destinationName.includes('inca')) {
      selectedCollection = imageCollections.himalayas; // Use mountain collection for high altitude destinations
    } else if (destinationName.includes('pyramid') || country.includes('egypt') || destinationName.includes('cappadocia') || country.includes('turkey')) {
      selectedCollection = imageCollections.europe; // Use cultural collection
    } else if (destinationName.includes('bali') || country.includes('indonesia') || destinationName.includes('vietnam') || country.includes('vietnam') || destinationName.includes('coffee') || country.includes('colombia')) {
      selectedCollection = imageCollections.tokyo; // Use Asian collection for cultural experiences
    }

    // Advanced activity-based image selection for maximum relevance
    const activityKeywords = {
      arrival: ['arrival', 'airport', 'transfer', 'welcome', 'check-in'],
      wildlife: ['wildlife', 'safari', 'animals', 'lion', 'elephant', 'giraffe', 'zebra', 'big five', 'migration', 'spotting'],
      cultural: ['cultural', 'temple', 'monastery', 'village', 'traditional', 'indigenous', 'ceremony', 'local', 'heritage'],
      adventure: ['trek', 'hiking', 'climbing', 'expedition', 'adventure', 'climb', 'summit', 'trail'],
      water: ['snorkeling', 'diving', 'swimming', 'water', 'reef', 'marine', 'ocean', 'beach', 'cruise'],
      relaxation: ['spa', 'relaxation', 'leisure', 'wellness', 'massage', 'yoga', 'meditation'],
      food: ['cooking', 'cuisine', 'food', 'dining', 'restaurant', 'culinary', 'tasting'],
      nature: ['forest', 'jungle', 'canopy', 'river', 'mountain', 'peak', 'sunrise', 'sunset'],
      transportation: ['train', 'boat', 'flight', 'drive', 'journey', 'transfer']
    };

    // Find the most relevant activity type
    let activityType = 'default';
    let maxMatches = 0;
    
    Object.entries(activityKeywords).forEach(([activity, keywords]) => {
      const matches = keywords.filter(keyword => 
        dayTitle.includes(keyword) || dayDescription.includes(keyword)
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        activityType = activity;
      }
    });

    // Select images based on specific activity types
    switch (activityType) {
      case 'arrival':
        return selectedCollection[0]; // Overview/arrival image
      case 'wildlife':
        return imageCollections.safari[Math.min(index, imageCollections.safari.length - 1)];
      case 'cultural':
        // Use middle portion of collection for cultural activities
        const culturalStart = Math.floor(selectedCollection.length * 0.3);
        return selectedCollection[culturalStart + (index % 3)];
      case 'adventure':
        // Use adventure-focused images (positions 1-4 typically)
        return selectedCollection[1 + (index % Math.min(4, selectedCollection.length - 1))];
      case 'water':
        // For water activities, use Maldives collection if not already specific
        if (selectedCollection === imageCollections.maldives) {
          return selectedCollection[3 + (index % 4)]; // Water activity images
        }
        return selectedCollection[index % selectedCollection.length];
      case 'relaxation':
        // Use later images in collection (typically spa/relaxation themed)
        return selectedCollection[selectedCollection.length - 1 - (index % 2)];
      case 'food':
        // Use food/cultural images (middle range)
        const foodIndex = Math.floor(selectedCollection.length * 0.4) + (index % 2);
        return selectedCollection[foodIndex];
      case 'nature':
        // Use nature/landscape images (early-middle range)
        return selectedCollection[(index + 2) % selectedCollection.length];
      case 'transportation':
        return selectedCollection[0]; // Overview transportation image
      default:
        return selectedCollection[index % selectedCollection.length];
    }
  };

  // Generate unique day-specific highlights for each destination and day
  const getHighlightsForDay = (day: any, index: number) => {
    const dayActivities = day?.activities || [];
    const destinationName = destination?.name.toLowerCase() || '';
    const dayTitle = day?.title?.toLowerCase() || '';
    const dayNumber = index + 1;
    
    // Extract meaningful highlights from activities if available
    if (dayActivities.length > 0) {
      return dayActivities.slice(0, 4).map((activity: any) => 
        typeof activity === 'string' ? activity : activity.name || activity.description || 'Experience included'
      );
    }

    // Generate unique day-specific highlights based on destination and day progression
    if (destinationName.includes('tokyo') || destinationName.includes('japan')) {
      const tokyoHighlights = [
        // Day 1
        ["Arrival at Narita Airport with private transfer", "Traditional welcome tea ceremony", "Evening exploration of Shibuya district", "Authentic izakaya dining experience"],
        // Day 2
        ["Early morning visit to Tsukiji Fish Market", "Sushi preparation masterclass", "Afternoon in Asakusa traditional district", "Tokyo Skytree observation deck access"],
        // Day 3
        ["Day trip to Mount Fuji scenic area", "Traditional onsen hot spring experience", "Lake Kawaguchi panoramic views", "Local craft workshop participation"],
        // Day 4
        ["Meiji Shrine spiritual morning visit", "Harajuku fashion district exploration", "Traditional kaiseki lunch preparation", "Ginza premium shopping district tour"],
        // Day 5
        ["Imperial Palace East Gardens visit", "Calligraphy and ink painting workshop", "Ueno Park museum district exploration", "Final evening at rooftop restaurant"],
        // Day 6
        ["Kyoto bullet train journey experience", "Fushimi Inari shrine thousand gates", "Traditional bamboo forest walk", "Geisha district historical tour"],
        // Day 7
        ["Golden Pavilion temple visit", "Traditional tea ceremony participation", "Nijo Castle gardens exploration", "Departure arrangements and transfers"]
      ];
      return tokyoHighlights[Math.min(index, tokyoHighlights.length - 1)] || tokyoHighlights[0];
      
    } else if (destinationName.includes('maldives')) {
      const maldivesHighlights = [
        // Day 1
        ["Seaplane transfer with aerial island views", "Overwater villa check-in and orientation", "Sunset cocktails on private deck", "Welcome dinner under the stars"],
        // Day 2
        ["Morning snorkeling in house reef", "Marine biology guided tour", "Beachfront spa treatment session", "Private beach dinner setup"],
        // Day 3
        ["Dolphin watching cruise expedition", "Underwater restaurant dining experience", "Infinity pool relaxation time", "Night fishing traditional experience"],
        // Day 4
        ["Full day diving excursion", "Coral reef conservation education", "Beach volleyball and water sports", "Maldivian cultural performance evening"],
        // Day 5
        ["Private island picnic excursion", "Sandbank helicopter tour", "Couples massage in overwater spa", "Sunset sailing on traditional dhoni"],
        // Day 6
        ["Deep sea fishing adventure", "Cooking class with resort chef", "Kayaking through mangrove channels", "Stargazing session with astronomer"],
        // Day 7
        ["Final sunrise yoga session", "Underwater photography workshop", "Farewell reef snorkeling", "Seaplane departure with memories"]
      ];
      return maldivesHighlights[Math.min(index, maldivesHighlights.length - 1)] || maldivesHighlights[0];
      
    } else if (destinationName.includes('safari') || destinationName.includes('kenya')) {
      const safariHighlights = [
        // Day 1
        ["Arrival in Nairobi with wildlife briefing", "Giraffe Centre conservation visit", "African cuisine welcome dinner", "Traditional Maasai cultural presentation"],
        // Day 2
        ["Early morning game drive", "Big Five tracking with expert guide", "Bush breakfast in scenic location", "Evening at luxury safari lodge"],
        // Day 3
        ["Hot air balloon safari at sunrise", "Champagne breakfast in savanna", "Maasai village cultural immersion", "Traditional dancing and crafts workshop"],
        // Day 4
        ["Full day in Masai Mara reserve", "Great Migration viewing (seasonal)", "Photography workshop with professional", "Sundowner drinks overlooking plains"],
        // Day 5
        ["Walking safari with armed ranger", "Animal tracking and bush skills", "Conservation project visit", "Stargazing with traditional stories"],
        // Day 6
        ["Final game drive for rare sightings", "Visit to anti-poaching unit", "Farewell bush dinner under acacia", "Traditional blessing ceremony"],
        // Day 7
        ["Departure game drive to airstrip", "Flight over the Great Rift Valley", "Nairobi city tour if time permits", "International flight connections"]
      ];
      return safariHighlights[Math.min(index, safariHighlights.length - 1)] || safariHighlights[0];
      
    } else if (destinationName.includes('himalaya') || destinationName.includes('everest') || destinationName.includes('nepal')) {
      const himalayanHighlights = [
        // Day 1
        ["Arrival in Kathmandu with mountain views", "Traditional Nepali welcome ceremony", "Durbar Square UNESCO heritage tour", "Equipment fitting for trekking"],
        // Day 2
        ["Scenic flight to Lukla airstrip", "Trek beginning through Sherpa villages", "Suspension bridge crossings", "First mountain lodge accommodation"],
        // Day 3
        ["Namche Bazaar acclimatization day", "Sherpa culture museum visit", "Panoramic Everest viewpoint hike", "Traditional yak cheese tasting"],
        // Day 4
        ["Trek to Tengboche monastery", "Buddhist prayer ceremony participation", "Ama Dablam mountain photography", "Meditation session with monks"],
        // Day 5
        ["Advanced altitude trekking", "Everest Base Camp approach", "High altitude photography workshop", "Sherpa stories around lodge fire"],
        // Day 6
        ["Summit attempt preparation", "Sunrise over Himalayan peaks", "Prayer flag ceremony", "Celebration dinner at base camp"],
        // Day 7
        ["Helicopter rescue scenic flight", "Mountain rescue demonstration", "Kathmandu valley sightseeing", "Traditional farewell dinner"]
      ];
      return himalayanHighlights[Math.min(index, himalayanHighlights.length - 1)] || himalayanHighlights[0];
      
    } else if (destinationName.includes('amazon') || destinationName.includes('ecuador')) {
      const amazonHighlights = [
        // Day 1
        ["Arrival in Quito with Andes views", "Flight to Amazon basin", "Canoe journey into rainforest", "First night sounds of jungle"],
        // Day 2
        ["Dawn bird watching expedition", "Medicinal plant discovery walk", "Indigenous community visit", "Traditional shaman healing ceremony"],
        // Day 3
        ["Canopy walkway adventure", "Exotic wildlife photography", "River dolphin spotting cruise", "Night sounds wildlife tour"],
        // Day 4
        ["Jaguar tracking expedition", "Rainforest survival skills workshop", "Traditional fishing techniques", "Stargazing from jungle clearing"],
        // Day 5
        ["Butterfly farm conservation visit", "Traditional craft making workshop", "Piranha fishing experience", "Cultural dance performance"],
        // Day 6
        ["Final wildlife spotting tour", "Conservation project participation", "Traditional goodbye ceremony", "Return journey preparation"],
        // Day 7
        ["Morning bird chorus experience", "Flight back to civilization", "Reflection and photo sharing", "International departure connections"]
      ];
      return amazonHighlights[Math.min(index, amazonHighlights.length - 1)] || amazonHighlights[0];
    }

    // Dynamic highlights for other destinations based on day progression
    const genericHighlights = [
      [`Welcome arrival and orientation`, `Local area familiarization tour`, `Traditional welcome dinner`, `Evening cultural introduction`],
      [`Morning guided exploration`, `Historical site visits`, `Local cuisine tasting experience`, `Afternoon leisure activities`],
      [`Adventure activity participation`, `Cultural immersion experiences`, `Photography opportunities`, `Local artisan workshops`],
      [`Full day excursion`, `Scenic landscape exploration`, `Traditional craft learning`, `Evening entertainment`],
      [`Nature and wildlife discovery`, `Conservation education program`, `Outdoor adventure activities`, `Sunset viewing experience`],
      [`Cultural heritage deep dive`, `Local community interaction`, `Traditional skills workshop`, `Regional speciality tasting`],
      [`Final memorable experiences`, `Souvenir and craft shopping`, `Farewell celebration dinner`, `Departure preparations`]
    ];
    
    return genericHighlights[Math.min(index, genericHighlights.length - 1)] || genericHighlights[0];
  };

  // Generate destination-specific interactive hotspots with varied colors
  const getDestinationHotspots = () => {
    const destinationName = destination?.name.toLowerCase() || '';
    
    if (destinationName.includes('kenya') || destinationName.includes('safari')) {
      return [
        {
          id: "spot1",
          x: 25,
          y: 40,
          title: "Lion Pride Territory",
          description: "Witness majestic lions in their natural habitat during game drives.",
          icon: Crown,
          color: "text-amber-500"
        },
        {
          id: "spot2",
          x: 60,
          y: 30,
          title: "Elephant Migration Route",
          description: "Experience the incredible elephant herds on their ancient migration paths.",
          icon: Mountain,
          color: "text-slate-600"
        },
        {
          id: "spot3",
          x: 80,
          y: 60,
          title: "Giraffe Sanctuary",
          description: "Get up close with the tallest animals on Earth in protected reserves.",
          icon: TreePine,
          color: "text-green-600"
        },
        {
          id: "spot4",
          x: 45,
          y: 70,
          title: "Zebra Plains",
          description: "Marvel at thousands of zebras grazing across the endless savanna.",
          icon: Compass,
          color: "text-purple-600"
        }
      ];
    } else if (destinationName.includes('iceland')) {
      return [
        {
          id: "spot1",
          x: 25,
          y: 40,
          title: "Aurora Borealis Zone",
          description: "Witness the magical Northern Lights dancing across the Arctic sky.",
          icon: Sparkles,
          color: "text-green-400"
        },
        {
          id: "spot2",
          x: 60,
          y: 30,
          title: "Geothermal Wonders",
          description: "Relax in natural hot springs heated by the Earth's core energy.",
          icon: Zap,
          color: "text-blue-500"
        },
        {
          id: "spot3",
          x: 80,
          y: 60,
          title: "Glacier Adventures",
          description: "Explore ancient ice formations and crystal-clear ice caves.",
          icon: Snowflake,
          color: "text-cyan-300"
        },
        {
          id: "spot4",
          x: 45,
          y: 70,
          title: "Viking Heritage",
          description: "Discover Iceland's rich Norse history in charming fishing villages.",
          icon: Anchor,
          color: "text-orange-500"
        }
      ];
    } else if (destinationName.includes('santorini') || destinationName.includes('greece')) {
      return [
        {
          id: "spot1",
          x: 25,
          y: 40,
          title: "Caldera Views",
          description: "Marvel at breathtaking views of the volcanic caldera and Aegean Sea.",
          icon: Mountain,
          color: "text-blue-600"
        },
        {
          id: "spot2",
          x: 60,
          y: 30,
          title: "Oia Sunset",
          description: "Experience the world's most famous sunset from clifftop villages.",
          icon: Sun,
          color: "text-orange-400"
        },
        {
          id: "spot3",
          x: 80,
          y: 60,
          title: "Volcanic Wineries",
          description: "Taste unique wines grown in volcanic soil with caldera views.",
          icon: Grape,
          color: "text-purple-500"
        },
        {
          id: "spot4",
          x: 45,
          y: 70,
          title: "Aegean Sailing",
          description: "Sail crystal-clear waters to hidden beaches and sea caves.",
          icon: Anchor,
          color: "text-blue-500"
        }
      ];
    } else if (destinationName.includes('tokyo') || destinationName.includes('japan')) {
      return [
        {
          id: "spot1",
          x: 25,
          y: 40,
          title: "Cherry Blossoms",
          description: "Experience the magical sakura season in traditional gardens.",
          icon: Flower2,
          color: "text-pink-400"
        },
        {
          id: "spot2",
          x: 60,
          y: 30,
          title: "Historic Temples",
          description: "Visit ancient temples and shrines in the heart of modern Tokyo.",
          icon: Building,
          color: "text-red-600"
        },
        {
          id: "spot3",
          x: 80,
          y: 60,
          title: "Tsukiji Market",
          description: "Discover the world's largest fish market and authentic sushi culture.",
          icon: Fish,
          color: "text-blue-600"
        },
        {
          id: "spot4",
          x: 45,
          y: 70,
          title: "Bamboo Forests",
          description: "Walk through mystical bamboo groves in serene temple grounds.",
          icon: TreePine,
          color: "text-green-500"
        }
      ];
    } else if (destinationName.includes('norway') || destinationName.includes('fjord')) {
      return [
        {
          id: "spot1",
          x: 25,
          y: 40,
          title: "Dramatic Fjords",
          description: "Cruise through UNESCO World Heritage fjords with towering cliffs.",
          icon: Mountain,
          color: "text-gray-600"
        },
        {
          id: "spot2",
          x: 60,
          y: 30,
          title: "Whale Watching",
          description: "Spot orcas, humpback whales, and arctic wildlife in their habitat.",
          icon: Waves,
          color: "text-blue-600"
        },
        {
          id: "spot3",
          x: 80,
          y: 60,
          title: "Midnight Sun",
          description: "Experience the phenomenon of 24-hour daylight in summer.",
          icon: Sun,
          color: "text-yellow-400"
        },
        {
          id: "spot4",
          x: 45,
          y: 70,
          title: "Alpine Adventures",
          description: "Enjoy world-class skiing and mountain hiking opportunities.",
          icon: Snowflake,
          color: "text-cyan-300"
        }
      ];
    } else if (destinationName.includes('maldives')) {
      return [
        {
          id: "spot1",
          x: 25,
          y: 40,
          title: "Overwater Villas",
          description: "Stay in luxury overwater bungalows with direct lagoon access.",
          icon: TreePalm,
          color: "text-green-500"
        },
        {
          id: "spot2",
          x: 60,
          y: 30,
          title: "Coral Reefs",
          description: "Snorkel in pristine coral gardens with tropical marine life.",
          icon: Fish,
          color: "text-orange-500"
        },
        {
          id: "spot3",
          x: 80,
          y: 60,
          title: "Crystal Waters",
          description: "Swim in crystal-clear turquoise lagoons with perfect visibility.",
          icon: Waves,
          color: "text-blue-400"
        },
        {
          id: "spot4",
          x: 45,
          y: 70,
          title: "Sunset Cruises",
          description: "Watch breathtaking sunsets from traditional dhoni boats.",
          icon: Sun,
          color: "text-yellow-500"
        }
      ];
    }
    
    // Default hotspots for other destinations
    return [
      {
        id: "spot1",
        x: 25,
        y: 40,
        title: "Cultural Heritage",
        description: "Discover the rich cultural heritage and local traditions.",
        icon: Building,
        color: "text-amber-600"
      },
      {
        id: "spot2",
        x: 60,
        y: 30,
        title: "Natural Wonders",
        description: "Explore breathtaking natural landscapes and scenic views.",
        icon: Mountain,
        color: "text-green-600"
      },
      {
        id: "spot3",
        x: 80,
        y: 60,
        title: "Adventure Activities",
        description: "Experience thrilling adventures and outdoor activities.",
        icon: Zap,
        color: "text-blue-600"
      },
      {
        id: "spot4",
        x: 45,
        y: 70,
        title: "Local Cuisine",
        description: "Savor authentic local flavors and culinary traditions.",
        icon: Coffee,
        color: "text-red-600"
      }
    ];
  };

  const destinationHotspots = getDestinationHotspots();

  // Create booking mutation
  const createBooking = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: (booking) => {
      toast({
        title: "Booking Created!",
        description: "Redirecting to payment...",
      });
      // Navigate to payment page with the booking ID
      navigate(`/payment/${booking.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate total price in selected currency
  const calculateTotal = () => {
    const basePrice = parseFloat(destination?.price || "0");
    const classPrice = travelClasses.find(tc => tc.value === travelClass)?.price || 0;
    const upgradesTotal = selectedUpgrades.reduce((total, upgradeId) => {
      const upgrade = upgrades.find(u => u.id === upgradeId);
      return total + (upgrade?.price || 0);
    }, 0);
    
    // Add destination-specific fees
    let destinationFees = 0;
    if (destination?.name.toLowerCase().includes('maldives')) {
      destinationFees += 25; // Marine conservation fee
    } else if (destination?.name.toLowerCase().includes('tokyo')) {
      destinationFees += 15; // Tourist tax
    } else if (destination?.name.toLowerCase().includes('safari') || destination?.name.toLowerCase().includes('kenya') || destination?.name.toLowerCase().includes('serengeti')) {
      destinationFees += 50; // Conservation levy
    } else if (destination?.name.toLowerCase().includes('santorini')) {
      destinationFees += 20; // Tourism tax
    }
    
    const subtotal = (basePrice * guests) + classPrice + upgradesTotal + destinationFees;
    const couponDiscount = appliedCoupon ? Math.round(subtotal * (appliedCoupon.discount / 100)) : 0;
    const totalUSD = subtotal - couponDiscount;
    
    return convertPrice(totalUSD);
  };

  // Calculate subtotal (before coupon discount) in selected currency
  const calculateSubtotal = () => {
    const basePrice = parseFloat(destination?.price || "0");
    const classPrice = travelClasses.find(tc => tc.value === travelClass)?.price || 0;
    const upgradesTotal = selectedUpgrades.reduce((total, upgradeId) => {
      const upgrade = upgrades.find(u => u.id === upgradeId);
      return total + (upgrade?.price || 0);
    }, 0);
    
    // Add destination-specific fees
    let destinationFees = 0;
    if (destination?.name.toLowerCase().includes('maldives')) {
      destinationFees += 25; // Marine conservation fee
    } else if (destination?.name.toLowerCase().includes('tokyo')) {
      destinationFees += 15; // Tourist tax
    } else if (destination?.name.toLowerCase().includes('safari') || destination?.name.toLowerCase().includes('kenya') || destination?.name.toLowerCase().includes('serengeti')) {
      destinationFees += 50; // Conservation levy
    } else if (destination?.name.toLowerCase().includes('santorini')) {
      destinationFees += 20; // Tourism tax
    }
    
    const subtotalUSD = (basePrice * guests) + classPrice + upgradesTotal + destinationFees;
    return convertPrice(subtotalUSD);
  };

  const toggleUpgrade = (upgradeId: string) => {
    setSelectedUpgrades(prev => 
      prev.includes(upgradeId)
        ? prev.filter(id => id !== upgradeId)
        : [...prev, upgradeId]
    );
  };

  // Coupon code handlers
  const handleApplyCoupon = () => {
    if (!couponInput.trim() || !destination) return;
    
    const inputCode = couponInput.trim().toUpperCase();
    
    // Check if the entered coupon matches the destination's specific coupon code
    if (destination.couponCode && inputCode === destination.couponCode.toUpperCase()) {
      // Apply the destination-specific discount
      const discount = destination.discountPercentage || 15; // Use destination's discount or default to 15%
      
      setAppliedCoupon({ code: inputCode, discount });
      setCouponInput("");
      toast({
        title: "Coupon Applied!",
        description: `${discount}% discount has been applied to your ${destination.name} booking.`,
        variant: "default",
      });
    } else {
      toast({
        title: "Invalid Coupon",
        description: destination.couponCode 
          ? `This coupon code is not valid for ${destination.name}. Try ${destination.couponCode} instead.`
          : `This coupon code is not valid for ${destination.name}.`,
        variant: "destructive",
      });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast({
      title: "Coupon Removed",
      description: "Discount has been removed from your booking.",
    });
  };

  const handleDayTabClick = (dayNumber: number) => {
    setActiveItineraryDay(dayNumber);
    
    // Smooth scroll to the corresponding day card
    const dayElement = document.getElementById(`day-${dayNumber}`);
    if (dayElement) {
      dayElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  };

  const handleBookNow = () => {
    if (!user || !checkIn || !checkOut) return;

    // Calculate total in USD for database storage
    const basePrice = parseFloat(destination?.price || "0");
    const classPrice = travelClasses.find(tc => tc.value === travelClass)?.price || 0;
    const upgradesTotal = selectedUpgrades.reduce((total, upgradeId) => {
      const upgrade = upgrades.find(u => u.id === upgradeId);
      return total + (upgrade?.price || 0);
    }, 0);
    const subtotal = (basePrice * guests) + classPrice + upgradesTotal;
    const couponDiscount = appliedCoupon ? Math.round(subtotal * (appliedCoupon.discount / 100)) : 0;
    const totalUSD = subtotal - couponDiscount;

    const bookingData = {
      destinationId,
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
      guests,
      travelClass,
      upgrades: selectedUpgrades,
      totalAmount: totalUSD, // Store in USD
      currency: currency // Store selected currency
    };

    createBooking.mutate(bookingData);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-16 px-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-gold-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Destination Not Found</h1>
          <p className="text-muted-foreground mb-8">The destination you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/destinations")}>
            Return to Destinations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Parallax Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div 
          className="absolute inset-0 z-0"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        >
          <RobustImage
            src={destination.imageUrl}
            alt={destination.name}
            className="w-full h-full object-cover"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoadError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />
        </motion.div>

        <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <Badge className="mb-4 text-sm px-4 py-2 bg-black/60 text-white border-black/70 backdrop-blur-sm">
              {destination.duration} Days Adventure
            </Badge>
          </motion.div>
          
          {/* Semi-transparent backdrop for title and description only */}
          <div className="relative">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-2xl"></div>
            
            <div className="relative z-10 py-8 px-8">
              <motion.h1 
                className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-gold-accent to-white bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.7 }}
              >
                {destination.name}
              </motion.h1>
              
              <motion.p 
                className="text-lg md:text-xl mb-0 max-w-2xl mx-auto leading-relaxed text-white/95"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                {destination.description}
              </motion.p>
            </div>
          </div>
          
          <motion.div 
            className="inline-block mt-8"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3, duration: 0.8, type: "spring" }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => document.getElementById('itinerary-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-gold-accent to-lavender-accent hover:from-gold-accent/80 hover:to-lavender-accent/80 text-white font-semibold text-lg px-8 py-4 rounded-full"
              >
                Explore This Adventure
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronDown className="w-5 h-5 ml-2" />
                </motion.div>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating Progress Indicator */}
        <motion.div 
          className="fixed right-8 top-1/2 transform -translate-y-1/2 z-50"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2 }}
        >
          <div className="bg-black/20 backdrop-blur-sm rounded-full p-2">
            {journeyStages.map((stage, index) => (
              <motion.div
                key={stage.id}
                className={`w-3 h-3 rounded-full mb-2 transition-all duration-300 ${
                  currentScrollStage >= index ? 'bg-gold-accent' : 'bg-white/30'
                }`}
                whileHover={{ scale: 1.2 }}
                title={stage.title}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Day-by-Day Itinerary Component */}
      <DayByDayItinerary 
        destination={destination}
        activeDay={activeItineraryDay}
        onDaySelect={setActiveItineraryDay}
      />

      {/* Guest Reviews Section */}
      <section className="py-16 px-6 bg-gradient-to-b from-muted/10 to-background">
        <div className="max-w-6xl mx-auto">
          <Reviews destinationId={destination.id} destinationName={destination.name} />
        </div>
      </section>

      {/* Interactive Features & Booking Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-16">
            {/* Interactive Image with Hotspots */}
            <motion.div 
              className="lg:col-span-3"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card className="glass-morphism overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-2xl text-gold-accent">Explore Key Highlights</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative h-96 overflow-visible pr-8">
                    <RobustImage
                      src={destination.imageUrl}
                      alt={destination.name}
                      className="w-full h-full object-cover rounded-b-lg"
                    />
                    <div className="absolute inset-0 bg-black/20 rounded-b-lg" />
                    
                    {/* Interactive Hotspots */}
                    {destinationHotspots.map((hotspot, index) => {
                      // Adjust positioning to prevent cutoff on the right side
                      const adjustedX = Math.min(hotspot.x, 75); // Cap at 75% to prevent right-side cutoff
                      return (
                        <motion.div
                          key={hotspot.id}
                          className="absolute z-20"
                          style={{ left: `${adjustedX}%`, top: `${hotspot.y}%` }}
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.2, type: "spring" }}
                          viewport={{ once: true }}
                        >
                          <motion.button
                            className={`w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center ${hotspot.color} hover:bg-white/30 transition-all duration-300 shadow-lg`}
                            onClick={() => setActiveHotspot(activeHotspot === hotspot.id ? null : hotspot.id)}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <hotspot.icon className="w-5 h-5" />
                          </motion.button>
                          
                          <AnimatePresence>
                            {activeHotspot === hotspot.id && (
                              <motion.div
                                className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg min-w-52 z-30 shadow-xl"
                                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                transition={{ type: "spring", stiffness: 200 }}
                              >
                                <h4 className="font-semibold mb-2 text-gold-accent">{hotspot.title}</h4>
                                <p className="text-sm text-gray-200">{hotspot.description}</p>
                                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Booking Form */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card className="glass-morphism sticky top-32">
                <CardHeader>
                  <CardTitle className="text-2xl text-gold-accent">Book Your Adventure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gold-accent">
                      ${destination.price}
                    </div>
                    <div className="text-sm text-muted-foreground">per person</div>
                  </div>

                  <div className="space-y-4">
                    {/* Check-in Date */}
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Check In</Label>
                      <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal pl-10 bg-slate-panel border-border hover:bg-slate-panel/80 hover:text-gold-accent focus:border-gold-accent",
                              !checkIn && "text-muted-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {checkIn ? (
                                <>
                                  <Calendar className="w-3 h-3 text-muted-foreground pointer-events-none" />
                                  <span>{format(checkIn, "PPP")}</span>
                                </>
                              ) : (
                                "Pick check-in date"
                              )}
                            </div>
                            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={checkIn}
                            onSelect={(date) => {
                              setCheckIn(date);
                              setCheckInOpen(false);
                              // Auto-set checkout date if not already set
                              if (date && !checkOut) {
                                setCheckOut(addDays(date, destination?.duration || 7));
                              }
                            }}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Check-out Date */}
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Check Out</Label>
                      <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal pl-10 bg-slate-panel border-border hover:bg-slate-panel/80 hover:text-gold-accent focus:border-gold-accent",
                              !checkOut && "text-muted-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {checkOut ? (
                                <>
                                  <Calendar className="w-3 h-3 text-muted-foreground pointer-events-none" />
                                  <span>{format(checkOut, "PPP")}</span>
                                </>
                              ) : (
                                "Pick check-out date"
                              )}
                            </div>
                            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={checkOut}
                            onSelect={(date) => {
                              setCheckOut(date);
                              setCheckOutOpen(false);
                            }}
                            disabled={(date) => 
                              date < new Date() || 
                              date < new Date("1900-01-01") ||
                              Boolean(checkIn && date <= checkIn)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label htmlFor="guests">Guests</Label>
                      <Select value={guests.toString()} onValueChange={(value) => setGuests(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: destination.maxGuests }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1} Guest{i > 0 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="travel-class">Travel Class</Label>
                      <Select value={travelClass} onValueChange={setTravelClass}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {travelClasses.map((tc) => (
                            <SelectItem key={tc.value} value={tc.value}>
                              {tc.label} {tc.price > 0 && `(+$${tc.price})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label>Upgrades</Label>
                    <div className="space-y-2 mt-2">
                      {upgrades.map((upgrade) => (
                        <div key={upgrade.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={upgrade.id}
                            checked={selectedUpgrades.includes(upgrade.id)}
                            onChange={() => toggleUpgrade(upgrade.id)}
                            className="rounded"
                          />
                          <label htmlFor={upgrade.id} className="text-sm flex-1 cursor-pointer">
                            {upgrade.name} (+${upgrade.price})
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Coupon Code Section */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Promo Code</Label>
                    <p className="text-sm text-muted-foreground">Enter a coupon code for additional savings</p>
                    
                    {/* Applied Coupon Display */}
                    {appliedCoupon && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              Applied: <span className="font-mono font-bold">{appliedCoupon.code}</span>
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-300">{appliedCoupon.discount}% discount active</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRemoveCoupon}
                            className="text-green-600 border-green-300 hover:bg-green-100"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Manual Coupon Input */}
                    {!appliedCoupon && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter coupon code (e.g., AUSSIE25)"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          className="flex-1 font-mono"
                          onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        />
                        <Button
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={!couponInput.trim()}
                          className="flex items-center gap-1"
                        >
                          <Tag className="w-4 h-4" />
                          Apply
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Detailed Pricing Breakdown */}
                  <div className="pricing-breakdown-section">
                    <h4 className="font-semibold text-base mb-4">
                      Price Breakdown
                    </h4>
                    
                    {/* Base Price */}
                    <div className="flex justify-between text-sm mb-3">
                      <span>Base price × {guests} guest{guests > 1 ? 's' : ''}</span>
                      <span>{formatPrice(parseFloat(destination?.price || "0") * guests)}</span>
                    </div>
                    
                    {/* Travel Class Premium */}
                    {travelClass === "business" && (
                      <div className="flex justify-between text-sm mb-3">
                        <span>Business class upgrade</span>
                        <span>+{formatPrice(travelClasses.find(tc => tc.value === travelClass)?.price || 0)}</span>
                      </div>
                    )}
                    
                    {/* Individual Upgrades */}
                    {selectedUpgrades.map((upgradeId) => {
                      const upgrade = upgrades.find(u => u.id === upgradeId);
                      return upgrade ? (
                        <div key={upgradeId} className="flex justify-between text-sm mb-3">
                          <span>{upgrade.name}</span>
                          <span>+{formatPrice(upgrade.price)}</span>
                        </div>
                      ) : null;
                    })}
                    
                    {/* Destination-specific inclusions and fees */}
                    {destination?.name.toLowerCase().includes('maldives') && (
                      <>
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>Seaplane transfers</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>Overwater villa access</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>Marine conservation fee</span>
                          <span>{formatPrice(25)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>Diving equipment rental</span>
                          <span>Included</span>
                        </div>
                      </>
                    )}
                    
                    {destination?.name.toLowerCase().includes('tokyo') && (
                      <>
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>JR Pass (7 days)</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>Cultural experiences</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>Tourist tax</span>
                          <span>{formatPrice(15)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>Temple entrance fees</span>
                          <span>Included</span>
                        </div>
                      </>
                    )}
                    
                    {(destination?.name.toLowerCase().includes('safari') || destination?.name.toLowerCase().includes('kenya') || destination?.name.toLowerCase().includes('serengeti')) && (
                      <>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Game drive vehicle</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Professional guide</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Park entrance fees</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Conservation levy</span>
                          <span>{formatPrice(50)}</span>
                        </div>
                      </>
                    )}
                    
                    {(destination?.name.toLowerCase().includes('himalayas') || destination?.name.toLowerCase().includes('everest') || destination?.name.toLowerCase().includes('nepal')) && (
                      <>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Trekking permits</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Sherpa guide</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Porter services</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Altitude sickness insurance</span>
                          <span>Included</span>
                        </div>
                      </>
                    )}
                    
                    {destination?.name.toLowerCase().includes('santorini') && (
                      <>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Ferry transfers</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Wine tasting tours</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Tourism tax</span>
                          <span>{formatPrice(20)}</span>
                        </div>
                      </>
                    )}
                    
                    {destination?.name.toLowerCase().includes('iceland') && (
                      <>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Northern lights tours</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Geothermal spa access</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Environmental tax</span>
                          <span>{formatPrice(30)}</span>
                        </div>
                      </>
                    )}
                    
                    {destination?.name.toLowerCase().includes('amazon') && (
                      <>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Jungle guide services</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Wildlife research permits</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Conservation fee</span>
                          <span>{formatPrice(35)}</span>
                        </div>
                      </>
                    )}
                    
                    {/* General inclusions for all destinations */}
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Airport transfers</span>
                      <span>Included</span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>24/7 customer support</span>
                      <span>Included</span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Travel insurance</span>
                      <span>Included</span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-muted-foreground mb-4">
                      <span>Taxes & service fees</span>
                      <span>Included</span>
                    </div>
                    
                    {/* Subtotal */}
                    <div className="flex justify-between text-sm font-medium border-t pt-3 mb-3">
                      <span>Subtotal</span>
                      <span>{formatPrice(calculateSubtotal())}</span>
                    </div>
                    
                    {/* Coupon Discount */}
                    {appliedCoupon && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-medium mb-3">
                        <span>Coupon Discount ({appliedCoupon.code} - {appliedCoupon.discount}% off)</span>
                        <span>-{formatPrice(Math.round(calculateSubtotal() * (appliedCoupon.discount / 100)))}</span>
                      </div>
                    )}
                    
                    {/* Final Total */}
                    <div className="flex justify-between items-center border-t pt-3 mt-4">
                      <span className="text-lg font-semibold">Total Amount</span>
                      <span className="text-2xl font-bold text-gold-accent">
{formatPrice(calculateTotal(), currency)}
                      </span>
                    </div>
                    
                    {/* Per Person Breakdown */}
                    {guests > 1 && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Per person</span>
                        <span>{formatPrice(Math.round(calculateTotal() / guests), currency)}</span>
                      </div>
                    )}
                    
                    {/* Duration Information */}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Duration</span>
                      <span>{destination?.duration || 7} days, {(destination?.duration || 7) - 1} nights</span>
                    </div>
                    
                    {/* Payment Information */}
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <h5 className="text-sm font-medium mb-2">Payment Details</h5>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Deposit required (20%)</span>
                          <span>{formatPrice(Math.round(calculateTotal() * 0.2), currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Balance due before departure</span>
                          <span>{formatPrice(Math.round(calculateTotal() * 0.8), currency)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Secure payment processing via Stripe
                        </div>
                      </div>
                    </div>
                    
                    {/* Cancellation Policy */}
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h5 className="text-sm font-medium mb-2 text-blue-800 dark:text-blue-200">Cancellation Policy</h5>
                      <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                        <div>• Free cancellation up to 48 hours before departure</div>
                        <div>• 50% refund up to 7 days before departure</div>
                        <div>• Travel insurance included for full protection</div>
                        <div>• Weather guarantee - full refund for cancellations</div>
                      </div>
                    </div>
                    
                    {/* Value Highlights */}
                    <div className="mt-3 p-3 bg-gold-accent/10 rounded-lg">
                      <h5 className="text-sm font-medium mb-2 text-gold-accent">What's Included</h5>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>• Luxury accommodations & meals</div>
                        <div>• Professional guide services</div>
                        <div>• All transportation & transfers</div>
                        <div>• Equipment & activity fees</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleBookNow}
                    className="w-full bg-gradient-to-r from-gold-accent to-lavender-accent hover:from-gold-accent/80 hover:to-lavender-accent/80"
                    disabled={createBooking.isPending}
                  >
                    {createBooking.isPending ? "Booking..." : "Book Now"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}