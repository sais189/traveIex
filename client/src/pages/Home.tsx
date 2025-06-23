import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, Calendar, MapPin, Star, Plane, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { OptimizedImage } from "@/components/ui/optimized-image";
import EarthGlobe from "@/components/EarthGlobe";
import PricingBadge from "@/components/PricingBadge";
import { useCurrency } from "@/components/CurrencyProvider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Destination } from "@shared/schema";
import { useState, useMemo, useEffect, useRef } from "react";

export default function Home() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [searchDate, setSearchDate] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { formatPrice } = useCurrency();

  const { data: destinations = [] } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const featuredDestinations = useMemo(() => destinations.slice(0, 4), [destinations]);

  // Compute filtered destinations instead of using state
  const filteredDestinations = useMemo(() => {
    if (!searchQuery.trim()) {
      return destinations;
    }
    
    const searchTerms = searchQuery.toLowerCase().split(/[\s,]+/).filter(term => term.length > 0);
    
    const filtered = destinations.filter((destination) => {
      const searchableText = [
        destination.name,
        destination.country,
        destination.description,
        ...destination.name.split(/[\s-]+/),
        ...(destination.name.includes("Island") ? ["island"] : []),
        ...(destination.name.includes("Beach") ? ["beach", "coastal"] : []),
        ...(destination.name.includes("Mountain") ? ["mountain", "alpine"] : []),
        ...(destination.name.includes("City") ? ["city", "urban"] : []),
        ...(destination.name.includes("Desert") ? ["desert"] : []),
        ...(destination.name.includes("Forest") ? ["forest", "jungle"] : []),
      ].join(" ").toLowerCase();

      return searchTerms.some(term => 
        searchableText.includes(term) ||
        destination.country.toLowerCase().includes(term) ||
        destination.name.toLowerCase().includes(term)
      );
    });

    filtered.sort((a, b) => {
      const aScore = searchTerms.reduce((score, term) => {
        if (a.name.toLowerCase().includes(term)) score += 10;
        if (a.country.toLowerCase().includes(term)) score += 8;
        if (a.description.toLowerCase().includes(term)) score += 2;
        return score;
      }, 0);

      const bScore = searchTerms.reduce((score, term) => {
        if (b.name.toLowerCase().includes(term)) score += 10;
        if (b.country.toLowerCase().includes(term)) score += 8;
        if (b.description.toLowerCase().includes(term)) score += 2;
        return score;
      }, 0);

      return bScore - aScore;
    });

    return filtered;
  }, [searchQuery, destinations]);





  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = () => {
    const dateParam = searchDate ? `&date=${searchDate.toISOString().split('T')[0]}` : '';
    
    if (selectedDestination) {
      navigate(`/booking/${selectedDestination.id}${dateParam ? `?${dateParam.substring(1)}` : ''}`);
    } else if (searchQuery.trim() && filteredDestinations.length > 0) {
      // Navigate to destinations page with search query and date
      navigate(`/destinations?search=${encodeURIComponent(searchQuery)}${dateParam}`);
    } else {
      navigate(`/destinations${dateParam ? `?${dateParam.substring(1)}` : ''}`);
    }
  };

  const handleDestinationSelect = (destination: Destination) => {
    setSelectedDestination(destination);
    setSearchQuery(destination.name);
    setOpen(false);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSelectedDestination(null);
  };

  const handleBookNow = (destinationId: number) => {
    navigate(`/booking/${destinationId}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with 3D Globe */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="text-center lg:text-left"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                Explore the{" "}
                <span className="text-gold-accent">Future</span> of Travel
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-lg">
                Discover extraordinary destinations with our immersive travel
                experiences powered by cutting-edge technology.
              </p>

              {/* Search Bar */}
              <motion.div
                className="glass-morphism rounded-2xl p-6 mb-8 max-w-2xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative" ref={searchRef}>
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gold-accent w-5 h-5 z-10" />
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search destinations, countries, cities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setOpen(true)}
                        className="pl-10 pr-10 bg-slate-panel border-border focus:border-gold-accent text-foreground"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearSearch}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Search Results Dropdown */}
                    {open && (searchQuery.length > 0 || filteredDestinations.length > 0) && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-slate-panel border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {filteredDestinations.length === 0 ? (
                          <div className="p-4 text-muted-foreground text-center">
                            {searchQuery ? `No destinations found for "${searchQuery}"` : "Start typing to search destinations..."}
                          </div>
                        ) : (
                          <div className="p-2">
                            {searchQuery && (
                              <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border mb-2">
                                {filteredDestinations.length} result{filteredDestinations.length !== 1 ? 's' : ''} found
                              </div>
                            )}
                            {filteredDestinations.slice(0, 8).map((destination) => (
                              <button
                                key={destination.id}
                                onClick={() => handleDestinationSelect(destination)}
                                className="w-full text-left p-3 hover:bg-gold-accent/10 rounded-md transition-colors duration-200 border-0 bg-transparent"
                              >
                                <div className="flex items-center space-x-3">
                                  <MapPin className="w-4 h-4 text-gold-accent flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{destination.name}</div>
                                    <div className="text-sm text-muted-foreground truncate">{destination.country}</div>
                                  </div>
                                </div>
                              </button>
                            ))}
                            {filteredDestinations.length > 8 && (
                              <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t border-border mt-2">
                                +{filteredDestinations.length - 8} more destinations
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal pl-10 bg-slate-panel border-border hover:bg-slate-panel/80 focus:border-lavender-accent",
                            !searchDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lavender-accent calendar-icon w-5 h-5" />
                          {searchDate ? format(searchDate, "PPP") : "Pick a date"}
                          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={searchDate}
                          onSelect={(date) => {
                            setSearchDate(date);
                            setDatePickerOpen(false);
                          }}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="bg-gold-accent hover:bg-gold-accent/80 text-primary-foreground glow-hover"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {selectedDestination ? "Book Now" : "Search"}
                  </Button>
                </div>
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Button
                  onClick={() => navigate("/destinations")}
                  className="bg-lavender-accent hover:bg-lavender-accent/80 text-primary-foreground glow-hover"
                  size="lg"
                >
                  <Plane className="w-5 h-5 mr-2" />
                  Explore Trips
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/about")}
                  className="border-gold-accent text-gold-accent hover:bg-gold-accent hover:text-primary-foreground"
                >
                  Learn More
                </Button>
              </motion.div>
            </motion.div>

            {/* 3D Globe */}
            <motion.div
              className="flex justify-center lg:justify-end"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <EarthGlobe />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">Popular Destinations</h2>
            <p className="text-muted-foreground text-lg">
              Discover the world's most breathtaking locations
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDestinations.map((destination, index) => (
              <motion.div
                key={destination.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="h-full"
              >
                <Card 
                  className="glass-morphism card-tilt cursor-pointer glow-hover overflow-hidden h-full flex flex-col group"
                  onClick={() => navigate(`/booking/${destination.id}`)}
                >
                  <div className="relative h-48 flex-shrink-0 overflow-hidden">
                    <OptimizedImage
                      src={destination.imageUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4"}
                      alt={destination.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      priority={index < 2}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-4 left-4">
                      <PricingBadge 
                        promoTag={destination.promoTag}
                        discountPercentage={destination.discountPercentage ?? 0}
                        promoExpiry={destination.promoExpiry ? new Date(destination.promoExpiry).toISOString() : undefined}
                      />
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center space-x-1 bg-black bg-opacity-50 rounded-full px-2 py-1">
                        <Star className="w-3 h-3 text-gold-accent fill-current" />
                        <span className="text-xs text-white font-medium">{destination.rating}</span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-gold-accent transition-colors duration-200">
                        {destination.name}
                      </h3>
                      <p className="text-muted-foreground mb-4 text-sm leading-relaxed line-clamp-3 min-h-[4rem]">
                        {destination.shortDescription || (destination.description.length > 160 ? destination.description.slice(0, 160) + "..." : destination.description)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-auto pt-4">
                      <div className="flex flex-col">
                        {destination.originalPrice && parseFloat(destination.originalPrice) > parseFloat(destination.price) ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground line-through">
                              {formatPrice(parseFloat(destination.originalPrice))}
                            </span>
                            <span className="text-gold-accent font-bold text-xl">
                              {formatPrice(parseFloat(destination.price))}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gold-accent font-bold text-xl">
                            {formatPrice(parseFloat(destination.price))}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">per person</span>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookNow(destination.id);
                        }}
                        className="bg-lavender-accent hover:bg-lavender-accent/80 text-primary-foreground transition-all duration-200 px-6 hover:scale-105"
                        size="sm"
                      >
                        Book Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Button
              onClick={() => navigate("/destinations")}
              variant="outline"
              size="lg"
              className="border-gold-accent text-gold-accent hover:bg-gold-accent hover:text-primary-foreground"
            >
              View All Destinations
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}