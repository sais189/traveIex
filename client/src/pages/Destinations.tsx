import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Filter, Star, Clock, Users, Search, X, ArrowUpDown, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import PricingBadge from "@/components/PricingBadge";
import { useCurrency } from "@/components/CurrencyProvider";
import type { Destination } from "@shared/schema";

export default function Destinations() {
  const [, navigate] = useLocation();
  const [regionFilter, setRegionFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [dealsFilter, setDealsFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name, price-low, price-high, rating, duration, popularity
  const { formatPrice } = useCurrency();

  const { data: destinations = [], isLoading } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });

  // Handle URL search parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchQuery(decodeURIComponent(searchParam));
    }
  }, []);

  // Enhanced search function similar to Home page
  const searchDestinations = (query: string, destinations: Destination[]) => {
    if (!query.trim()) {
      return destinations;
    }

    const searchTerms = query.toLowerCase().split(/[\s,]+/).filter(term => term.length > 0);
    
    const filtered = destinations.filter((destination) => {
      const searchableText = [
        destination.name,
        destination.country,
        destination.description,
        ...destination.name.split(/[\s-]+/),
        // Common location keywords
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

    // Sort by relevance
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
  };

  // Apply search filter first, then other filters
  const searchFilteredDestinations = searchDestinations(searchQuery, destinations);
  
  const filteredDestinations = searchFilteredDestinations.filter((destination) => {
    let matches = true;

    // Region filter
    if (regionFilter !== "all") {
      const country = destination.country.toLowerCase();
      switch (regionFilter) {
        case "asia":
          matches = matches && (
            country.includes("japan") || 
            country.includes("china") || 
            country.includes("thailand") || 
            country.includes("india") || 
            country.includes("singapore") || 
            country.includes("korea") || 
            country.includes("vietnam") || 
            country.includes("indonesia") ||
            country.includes("malaysia") ||
            country.includes("philippines")
          );
          break;
        case "europe":
          matches = matches && (
            country.includes("france") || 
            country.includes("italy") || 
            country.includes("spain") || 
            country.includes("greece") || 
            country.includes("germany") || 
            country.includes("uk") || 
            country.includes("united kingdom") || 
            country.includes("england") || 
            country.includes("switzerland") || 
            country.includes("austria") || 
            country.includes("norway") || 
            country.includes("sweden") || 
            country.includes("iceland") ||
            country.includes("netherlands") ||
            country.includes("portugal")
          );
          break;
        case "americas":
          matches = matches && (
            country.includes("usa") || 
            country.includes("united states") || 
            country.includes("canada") || 
            country.includes("mexico") || 
            country.includes("brazil") || 
            country.includes("argentina") || 
            country.includes("chile") || 
            country.includes("peru") || 
            country.includes("colombia") ||
            country.includes("costa rica") ||
            country.includes("ecuador")
          );
          break;
        case "africa":
          matches = matches && (
            country.includes("south africa") || 
            country.includes("morocco") || 
            country.includes("egypt") || 
            country.includes("kenya") || 
            country.includes("tanzania") || 
            country.includes("madagascar") || 
            country.includes("namibia") || 
            country.includes("botswana") ||
            country.includes("zimbabwe") ||
            country.includes("zambia")
          );
          break;
      }
    }

    // Budget filter
    if (budgetFilter !== "all") {
      const price = parseFloat(destination.price);
      switch (budgetFilter) {
        case "under-1000":
          matches = matches && price < 1000;
          break;
        case "1000-2000":
          matches = matches && price >= 1000 && price <= 2000;
          break;
        case "2000-3000":
          matches = matches && price >= 2000 && price <= 3000;
          break;
        case "3000-plus":
          matches = matches && price > 3000;
          break;
      }
    }

    // Duration filter
    if (durationFilter !== "all") {
      switch (durationFilter) {
        case "3-5":
          matches = matches && destination.duration >= 3 && destination.duration <= 5;
          break;
        case "6-7":
          matches = matches && destination.duration >= 6 && destination.duration <= 7;
          break;
        case "8-14":
          matches = matches && destination.duration >= 8 && destination.duration <= 14;
          break;
        case "15-plus":
          matches = matches && destination.duration >= 15;
          break;
      }
    }

    // Deals filter
    if (dealsFilter !== "all") {
      const hasActivePromo = Boolean(
        destination.promoTag || 
        (destination.discountPercentage && destination.discountPercentage > 0) || 
        destination.seasonalTag || 
        destination.flashSale ||
        destination.couponCode ||
        (destination.groupDiscountMin && destination.groupDiscountMin > 0) ||
        (destination.loyaltyDiscount && destination.loyaltyDiscount > 0) ||
        destination.bundleDeal
      );

      switch (dealsFilter) {
        case "flash-sales":
          matches = matches && (destination.flashSale === true);
          break;
        case "seasonal":
          matches = matches && Boolean(destination.seasonalTag);
          break;
        case "group-discounts":
          matches = matches && ((destination.groupDiscountMin || 0) > 0);
          break;
        case "current-deals":
          matches = matches && hasActivePromo;
          break;
      }
    }

    return matches;
  });

  // Sort destinations based on selected criteria
  const sortDestinations = (destinations: Destination[], sortBy: string) => {
    const sorted = [...destinations];
    
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => {
          const priceA = parseInt(a.price.replace(/[^0-9]/g, '')) || 0;
          const priceB = parseInt(b.price.replace(/[^0-9]/g, '')) || 0;
          return priceA - priceB;
        });
      case "price-high":
        return sorted.sort((a, b) => {
          const priceA = parseInt(a.price.replace(/[^0-9]/g, '')) || 0;
          const priceB = parseInt(b.price.replace(/[^0-9]/g, '')) || 0;
          return priceB - priceA;
        });
      case "rating":
        return sorted.sort((a, b) => {
          const ratingA = a.rating ? parseFloat(a.rating.toString()) : 0;
          const ratingB = b.rating ? parseFloat(b.rating.toString()) : 0;
          return ratingB - ratingA;
        });
      case "duration":
        return sorted.sort((a, b) => {
          const durationA = a.duration || 0;
          const durationB = b.duration || 0;
          return durationA - durationB;
        });
      case "popularity":
        return sorted.sort((a, b) => {
          // Sort by combination of rating and deals availability
          const ratingA = a.rating ? parseFloat(a.rating.toString()) : 0;
          const ratingB = b.rating ? parseFloat(b.rating.toString()) : 0;
          const popularityA = ratingA + (a.flashSale ? 1 : 0) + (a.promoTag ? 0.5 : 0);
          const popularityB = ratingB + (b.flashSale ? 1 : 0) + (b.promoTag ? 0.5 : 0);
          return popularityB - popularityA;
        });
      case "name":
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  const sortedDestinations = sortDestinations(filteredDestinations, sortBy);

  const handleBookNow = (destinationId: number) => {
    navigate(`/booking/${destinationId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold mb-4">Explore Destinations</h1>
          <p className="text-muted-foreground text-lg">
            Discover your next adventure from our curated collection
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="glass-morphism rounded-2xl p-6 mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gold-accent w-5 h-5" />
              <Input
                type="text"
                placeholder="Search destinations, countries, cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-slate-panel border-border focus:border-gold-accent text-foreground"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                {searchFilteredDestinations.length} result{searchFilteredDestinations.length !== 1 ? 's' : ''} found for "{searchQuery}"
              </p>
            )}
          </div>

          {/* Sort and Filter Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowUpDown className="w-4 h-4" />
              <span>Sort by:</span>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48 bg-slate-panel border-border focus:border-gold-accent">
                <SelectValue placeholder="Sort destinations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="price-low">Price (Low to High)</SelectItem>
                <SelectItem value="price-high">Price (High to Low)</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="duration">Duration (Short to Long)</SelectItem>
                <SelectItem value="popularity">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="bg-slate-panel border-border focus:border-gold-accent">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="asia">Asia</SelectItem>
                <SelectItem value="europe">Europe</SelectItem>
                <SelectItem value="americas">Americas</SelectItem>
                <SelectItem value="africa">Africa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={budgetFilter} onValueChange={setBudgetFilter}>
              <SelectTrigger className="bg-slate-panel border-border focus:border-gold-accent">
                <SelectValue placeholder="Budget Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Budgets</SelectItem>
                <SelectItem value="under-1000">Under $1,000</SelectItem>
                <SelectItem value="1000-2000">$1,000 - $2,000</SelectItem>
                <SelectItem value="2000-3000">$2,000 - $3,000</SelectItem>
                <SelectItem value="3000-plus">$3,000+</SelectItem>
              </SelectContent>
            </Select>

            <Select value={durationFilter} onValueChange={setDurationFilter}>
              <SelectTrigger className="bg-slate-panel border-border focus:border-gold-accent">
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Duration</SelectItem>
                <SelectItem value="3-5">3-5 days</SelectItem>
                <SelectItem value="6-7">6-7 days</SelectItem>
                <SelectItem value="8-14">1-2 weeks</SelectItem>
                <SelectItem value="15-plus">2+ weeks</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dealsFilter} onValueChange={setDealsFilter}>
              <SelectTrigger className="bg-slate-panel border-border focus:border-gold-accent">
                <SelectValue placeholder="Current Deals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Destinations</SelectItem>
                <SelectItem value="current-deals">Current Deals</SelectItem>
                <SelectItem value="flash-sales">Flash Sales</SelectItem>
                <SelectItem value="seasonal">Seasonal Offers</SelectItem>
                <SelectItem value="group-discounts">Group Discounts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Destinations Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {sortedDestinations.map((destination, index) => (
            <motion.div
              key={destination.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => handleBookNow(destination.id)}
              className="cursor-pointer"
            >
              <Card className="glass-morphism card-tilt hover:scale-105 transition-transform duration-300 glow-hover overflow-hidden h-full flex flex-col group">
                <div className="relative h-64 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                  <img
                    src={destination.imageUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                    alt={destination.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                      target.onerror = () => {
                        target.style.display = 'none';
                        const parent = target.parentElement as HTMLElement;
                        parent.classList.add('flex', 'items-center', 'justify-center');
                        parent.innerHTML = `<div class="text-center text-slate-600 dark:text-slate-400"><h3 class="font-semibold text-lg">${destination.name}</h3><p class="text-sm mt-1">${destination.country}</p></div>`;
                      };
                    }}
                  />
                  <div className="absolute top-4 left-4">
                    <PricingBadge 
                      promoTag={destination.promoTag}
                      discountPercentage={destination.discountPercentage ?? 0}
                      promoExpiry={destination.promoExpiry ? destination.promoExpiry.toString() : undefined}
                      seasonalTag={destination.seasonalTag ?? undefined}
                      flashSale={destination.flashSale ?? false}
                      flashSaleEnd={destination.flashSaleEnd ? destination.flashSaleEnd.toString() : undefined}
                      couponCode={destination.couponCode || undefined}
                      discountType={destination.discountType || undefined}
                      groupDiscountMin={destination.groupDiscountMin ?? 0}
                      loyaltyDiscount={destination.loyaltyDiscount ?? 0}
                      bundleDeal={destination.bundleDeal}
                    />
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center space-x-1 bg-black bg-opacity-50 rounded-full px-2 py-1">
                      <Star className="w-3 h-3 text-gold-accent fill-current" />
                      <span className="text-xs text-white">{destination.rating}</span>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold line-clamp-2">{destination.name}</h3>
                    <div className="flex items-center ml-2">
                      <Star className="w-4 h-4 text-gold-accent mr-1 fill-current" />
                      <span className="text-sm">{destination.rating}</span>
                    </div>
                  </div>
                  
                  {/* Countries covered section */}
                  <div className="mb-3">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-gold-accent/10 border border-gold-accent/20">
                      <svg className="w-3 h-3 mr-1.5 text-gold-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-medium text-gold-accent">
                        {destination.country}
                      </span>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4 flex-1 text-sm leading-relaxed line-clamp-3">
                    {destination.description.slice(0, 120)}...
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        {destination.originalPrice && parseFloat(destination.originalPrice) > parseFloat(destination.price) ? (
                          <>
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(parseFloat(destination.originalPrice))}
                            </span>
                            <span className="text-2xl font-bold text-gold-accent">
                              {formatPrice(parseFloat(destination.price))}
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-gold-accent">
                            {formatPrice(parseFloat(destination.price))}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">per person</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{destination.duration} days, {destination.duration - 1} nights</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Up to {destination.maxGuests} guests</span>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <div className="w-full h-12 bg-gradient-to-r from-lavender-accent to-gold-accent rounded-lg flex items-center justify-center text-white font-semibold text-base transition-all duration-300 group-hover:shadow-lg">
                      <span>Click to Book This Adventure</span>
                      <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredDestinations.length === 0 && !isLoading && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-semibold mb-4">No destinations found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters to see more results
            </p>
            <Button
              onClick={() => {
                setRegionFilter("all");
                setBudgetFilter("all");
                setDurationFilter("all");
              }}
              variant="outline"
              className="border-gold-accent text-gold-accent hover:bg-gold-accent hover:text-primary-foreground"
            >
              Clear Filters
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
