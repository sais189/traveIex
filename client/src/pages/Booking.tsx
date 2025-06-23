import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Star, MapPin, Clock, Users, CreditCard, Home, Utensils, Plane, Coffee, Tag, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { loadStripe } from "@stripe/stripe-js";
import { RobustImage } from "@/components/ui/robust-image";
import DayByDayItinerary from "@/components/DayByDayItinerary";
import CouponCodeInput from "@/components/CouponCodeInput";
import Reviews from "@/components/Reviews";
import { cn } from "@/lib/utils";
import type { Destination } from "@shared/schema";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

export default function Booking() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  

  

  const [guests, setGuests] = useState("2");
  const [travelClass, setTravelClass] = useState("business");
  const [upgrades, setUpgrades] = useState<string[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [couponInput, setCouponInput] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);

  const destinationId = parseInt(params.id || "0");

  const { data: destination, isLoading } = useQuery<Destination>({
    queryKey: [`/api/destinations/${destinationId}`],
    enabled: !!destinationId,
  });

  const bookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      // First create the booking
      const bookingResponse = await apiRequest("POST", "/api/bookings", bookingData);
      const booking = await bookingResponse.json();
      
      // Then create payment intent
      const paymentResponse = await apiRequest("POST", "/api/create-payment-intent", {
        amount: totalAmount,
        bookingId: booking.id,
      });
      const { clientSecret } = await paymentResponse.json();
      
      return { booking, clientSecret };
    },
    onSuccess: async ({ clientSecret }) => {
      const stripe = await stripePromise;
      if (!stripe) {
        toast({
          title: "Payment Error",
          description: "Failed to load payment system",
          variant: "destructive",
        });
        return;
      }

      // Redirect to Stripe Checkout
      const { error } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/my-trips`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setShowSuccess(true);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book a trip",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [isAuthenticated, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <Skeleton className="h-80 w-full mb-6 rounded-2xl" />
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-3/4 mb-8" />
            </div>
            <div>
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          </div>
        </div>
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

  // Calculate upgrade costs
  const upgradeOptions = [
    { id: "private-chef", name: "Private Chef", price: 500 },
    { id: "sunset-yacht", name: "Sunset Yacht", price: 800 },
    { id: "spa-package", name: "Couples Spa Package", price: 400 },
  ];

  const basePrice = parseFloat(destination.price) * parseInt(guests);
  const classMultiplier = travelClass === "business" ? 1.2 : 1;
  const upgradeTotal = upgrades.reduce((total, upgradeId) => {
    const upgrade = upgradeOptions.find(u => u.id === upgradeId);
    return total + (upgrade?.price || 0);
  }, 0);
  
  // Add destination-specific fees (per person)
  let destinationFees = 0;
  if (destination.name.toLowerCase().includes('maldives')) {
    destinationFees += 25 * parseInt(guests); // Marine conservation fee per person
  } else if (destination.name.toLowerCase().includes('tokyo')) {
    destinationFees += 15 * parseInt(guests); // Tourist tax per person
  } else if (destination.name.toLowerCase().includes('safari') || destination.name.toLowerCase().includes('kenya')) {
    destinationFees += 50 * parseInt(guests); // Conservation levy per person
  } else if (destination.name.toLowerCase().includes('santorini')) {
    destinationFees += 20 * parseInt(guests); // Tourism tax per person
  }
  
  const subtotal = Math.round((basePrice * classMultiplier) + upgradeTotal + destinationFees);
  const couponDiscount = appliedCoupon ? Math.round(subtotal * (appliedCoupon.discount / 100)) : 0;
  const totalAmount = Math.max(subtotal - couponDiscount, 0);

  const handleUpgradeChange = (upgradeId: string, checked: boolean) => {
    if (checked) {
      setUpgrades(prev => [...prev, upgradeId]);
    } else {
      setUpgrades(prev => prev.filter(id => id !== upgradeId));
    }
  };

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

  const handleBookTrip = () => {
    const bookingData = {
      destinationId: destination.id,
      guests: parseInt(guests),
      travelClass,
      upgrades,
      totalAmount,
      originalAmount: subtotal,
      appliedCouponCode: appliedCoupon?.code || null,
      couponDiscount,
      status: "pending",
      paymentStatus: "pending",
    };

    bookingMutation.mutate(bookingData);
  };

  const features = destination.features as string[] || [
    "Luxury Accommodation",
    "All Meals Included",
    "Airport Transfers",
    "Water Activities",
    "Spa Access",
    "Premium Drinks",
  ];

  const itinerary = destination.itinerary as Array<{day: string, title: string, description: string}> || [
    { day: "Day 1-2", title: "Arrival & Settling In", description: "Airport transfer, accommodation check-in, welcome dinner" },
    { day: "Day 3-4", title: "Adventure Activities", description: "Guided tours, cultural experiences, outdoor adventures" },
    { day: "Day 5-6", title: "Relaxation & Leisure", description: "Spa treatments, leisure time, optional activities" },
    { day: "Day 7", title: "Departure", description: "Final breakfast, checkout, airport transfer" },
  ];

  return (
    <div className="min-h-screen pt-32 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/destinations")}
            className="mb-8 flex items-center text-muted-foreground hover:text-gold-accent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Destinations
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Trip Details */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <RobustImage
              src={destination.imageUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4"}
              alt={destination.name}
              className="w-full h-80 rounded-2xl mb-6 shadow-lg"
              fallbackSrc="https://images.unsplash.com/photo-1506905925346-21bda4d32df4"
            />

            <h1 className="text-4xl font-bold mb-4">{destination.name}</h1>
            <div className="flex items-center mb-6">
              <div className="flex items-center mr-6">
                <Star className="w-5 h-5 text-gold-accent mr-1 fill-current" />
                <span className="font-semibold">{destination.rating}</span>
                <span className="text-muted-foreground ml-1">
                  ({destination.reviewCount || 128} reviews)
                </span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-lavender-accent mr-2" />
                <span className="text-muted-foreground">{destination.country}</span>
              </div>
            </div>

            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              {destination.description}
            </p>

            {/* Day-by-Day Itinerary */}
            <div className="mb-8">
              <DayByDayItinerary destination={destination} />
            </div>

            {/* Included Features */}
            <Card className="glass-morphism">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">What's Included</h3>
                <div className="grid grid-cols-2 gap-4">
                  {features.map((feature, index) => {
                    const icons = [Home, Utensils, Plane, Coffee, MapPin, Users];
                    const Icon = icons[index % icons.length];
                    const colors = ["text-gold-accent", "text-lavender-accent", "text-mint-accent"];
                    const colorClass = colors[index % colors.length];
                    
                    return (
                      <div key={index} className="flex items-center">
                        <Icon className={`w-5 h-5 mr-3 ${colorClass}`} />
                        <span className="text-sm">{feature}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Booking Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="glass-morphism sticky top-32">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-gold-accent">
                      ${destination.price}
                    </span>
                    <span className="text-muted-foreground">per person</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {destination.duration} days, {destination.duration - 1} nights
                  </p>
                </div>



                {/* Guest Selection */}
                <div className="mb-6">
                  <Label className="text-sm font-semibold mb-2 block">Guests</Label>
                  <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger className="bg-slate-panel border-border focus:border-gold-accent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: destination.maxGuests || 8 }, (_, i) => i + 1).map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} Guest{num > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Travel Class */}
                <div className="mb-6">
                  <Label className="text-sm font-semibold mb-2 block">Travel Class</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={travelClass === "business" ? "default" : "outline"}
                      onClick={() => setTravelClass("business")}
                      className={
                        travelClass === "business"
                          ? "bg-gold-accent text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-gold-accent"
                      }
                    >
                      Business
                    </Button>
                    <Button
                      variant={travelClass === "economy" ? "default" : "outline"}
                      onClick={() => setTravelClass("economy")}
                      className={
                        travelClass === "economy"
                          ? "bg-gold-accent text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-gold-accent"
                      }
                    >
                      Economy
                    </Button>
                  </div>
                </div>

                {/* Optional Upgrades */}
                <div className="mb-8">
                  <Label className="text-sm font-semibold mb-3 block">
                    Optional Upgrades
                  </Label>
                  <div className="space-y-3">
                    {upgradeOptions.map((upgrade) => (
                      <div key={upgrade.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={upgrade.id}
                          checked={upgrades.includes(upgrade.id)}
                          onCheckedChange={(checked) =>
                            handleUpgradeChange(upgrade.id, checked as boolean)
                          }
                          className="border-gold-accent data-[state=checked]:bg-gold-accent"
                        />
                        <Label htmlFor={upgrade.id} className="text-sm cursor-pointer">
                          {upgrade.name} (+${upgrade.price})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coupon Code Section */}
                <div className="space-y-4 mb-6">
                  <div className="border-t border-border pt-6">
                    <Label className="text-base font-semibold">Promo Code</Label>
                    <p className="text-sm text-muted-foreground mb-4">Enter a coupon code for additional savings</p>
                    
                    {/* Quick Apply Available Coupon */}
                    {destination.couponCode && !appliedCoupon && (
                      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                              Available: <span className="font-mono font-bold">{destination.couponCode}</span>
                            </p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-300">Click to apply 15% discount</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setAppliedCoupon({ code: destination.couponCode!, discount: 15 });
                              toast({
                                title: "Coupon Applied!",
                                description: `15% discount applied to your booking.`,
                              });
                            }}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Applied Coupon Display */}
                    {appliedCoupon && (
                      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
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
                            onClick={() => {
                              setAppliedCoupon(null);
                              toast({
                                title: "Coupon Removed",
                                description: "Discount has been removed.",
                              });
                            }}
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
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={!couponInput.trim()}
                        >
                          Apply
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detailed Pricing Breakdown */}
                <div className="border-t border-border pt-6">
                  <div className="space-y-3 mb-6">
                    <h4 className="font-semibold text-base mb-4">Price Breakdown</h4>
                    
                    {/* Base Price */}
                    <div className="flex justify-between text-sm">
                      <span>Base price (${parseFloat(destination.price).toLocaleString()} × {guests} guest{guests !== "1" ? 's' : ''})</span>
                      <span>${(parseFloat(destination.price) * parseInt(guests)).toLocaleString()}</span>
                    </div>
                    
                    {/* Travel Class Premium */}
                    {travelClass === "business" && (
                      <div className="flex justify-between text-sm">
                        <span>Business class upgrade</span>
                        <span>+${Math.round(basePrice * 0.2).toLocaleString()}</span>
                      </div>
                    )}
                    
                    {/* Individual Upgrades */}
                    {upgrades.map((upgradeId) => {
                      const upgrade = upgradeOptions.find(u => u.id === upgradeId);
                      return upgrade ? (
                        <div key={upgradeId} className="flex justify-between text-sm">
                          <span>{upgrade.name}</span>
                          <span>+${upgrade.price.toLocaleString()}</span>
                        </div>
                      ) : null;
                    })}
                    
                    {/* Destination-specific fees (chargeable) */}
                    {destination.name.toLowerCase().includes('maldives') && (
                      <div className="flex justify-between text-sm">
                        <span>Marine conservation fee × {guests} guest{guests !== "1" ? 's' : ''}</span>
                        <span>+${(25 * parseInt(guests)).toLocaleString()}</span>
                      </div>
                    )}
                    
                    {destination.name.toLowerCase().includes('tokyo') && (
                      <div className="flex justify-between text-sm">
                        <span>Tourist tax × {guests} guest{guests !== "1" ? 's' : ''}</span>
                        <span>+${(15 * parseInt(guests)).toLocaleString()}</span>
                      </div>
                    )}
                    
                    {(destination.name.toLowerCase().includes('safari') || destination.name.toLowerCase().includes('kenya')) && (
                      <div className="flex justify-between text-sm">
                        <span>Conservation levy × {guests} guest{guests !== "1" ? 's' : ''}</span>
                        <span>+${(50 * parseInt(guests)).toLocaleString()}</span>
                      </div>
                    )}
                    
                    {destination.name.toLowerCase().includes('santorini') && (
                      <div className="flex justify-between text-sm">
                        <span>Tourism tax × {guests} guest{guests !== "1" ? 's' : ''}</span>
                        <span>+${(20 * parseInt(guests)).toLocaleString()}</span>
                      </div>
                    )}
                    
                    {/* Destination-specific inclusions (free) */}
                    {destination.name.toLowerCase().includes('maldives') && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Seaplane transfers</span>
                        <span>Included</span>
                      </div>
                    )}
                    
                    {destination.name.toLowerCase().includes('tokyo') && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>JR Pass (7 days)</span>
                        <span>Included</span>
                      </div>
                    )}
                    
                    {(destination.name.toLowerCase().includes('safari') || destination.name.toLowerCase().includes('kenya')) && (
                      <>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Park entrance fees</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Conservation levy</span>
                          <span>$50</span>
                        </div>
                      </>
                    )}
                    
                    {(destination.name.toLowerCase().includes('himalayas') || destination.name.toLowerCase().includes('everest')) && (
                      <>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Trekking permits</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Guide & porter fees</span>
                          <span>Included</span>
                        </div>
                      </>
                    )}
                    
                    {destination.name.toLowerCase().includes('santorini') && (
                      <>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Ferry transfers</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Tourism tax</span>
                          <span>$20</span>
                        </div>
                      </>
                    )}
                    
                    {/* General taxes and fees */}
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Taxes & service fees</span>
                      <span>Included</span>
                    </div>
                    
                    {/* Subtotal */}
                    <div className="flex justify-between text-sm font-medium border-t pt-2">
                      <span>Subtotal</span>
                      <span>${subtotal.toLocaleString()}</span>
                    </div>
                    
                    {/* Coupon Discount */}
                    {appliedCoupon && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-medium">
                        <span>Coupon Discount ({appliedCoupon.code} - {appliedCoupon.discount}% off)</span>
                        <span>-${couponDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {/* Final Total */}
                    <div className="flex justify-between items-center border-t pt-3 mt-4">
                      <span className="text-lg font-semibold">Total Amount</span>
                      <span className="text-2xl font-bold text-gold-accent">
                        ${Math.max(totalAmount, 0).toLocaleString()}
                      </span>
                    </div>
                    
                    {/* Per Person Breakdown */}
                    {parseInt(guests) > 1 && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Per person</span>
                        <span>${Math.round(totalAmount / parseInt(guests)).toLocaleString()}</span>
                      </div>
                    )}
                    
                    {/* Payment Information */}
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <h5 className="text-sm font-medium mb-2">Payment Details</h5>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Deposit required (20%)</span>
                          <span>${Math.round(totalAmount * 0.2).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Balance due before departure</span>
                          <span>${Math.round(totalAmount * 0.8).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Cancellation Policy */}
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h5 className="text-sm font-medium mb-2 text-blue-800 dark:text-blue-200">Cancellation Policy</h5>
                      <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                        <div>• Free cancellation up to 48 hours before departure</div>
                        <div>• 50% refund up to 7 days before departure</div>
                        <div>• Travel insurance recommended for full protection</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleBookTrip}
                    disabled={bookingMutation.isPending}
                    className="w-full bg-gold-accent hover:bg-gold-accent/80 text-primary-foreground font-bold py-4 glow-hover mb-4"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {bookingMutation.isPending ? "Processing..." : "Book Trip Now"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Secure payment powered by Stripe. Full refund available up to 48 hours before departure.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Guest Reviews Section */}
      <section className="py-16 px-6 bg-gradient-to-b from-muted/10 to-background">
        <div className="max-w-6xl mx-auto">
          <Reviews destinationId={destination.id} destinationName={destination.name} />
        </div>
      </section>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="glass-morphism border-border">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="success-bounce">
                <div className="w-16 h-16 bg-mint-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                <p className="text-muted-foreground">Your dream vacation has been successfully booked.</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            <Button
              onClick={() => navigate("/my-trips")}
              className="w-full bg-gold-accent hover:bg-gold-accent/80 text-primary-foreground"
            >
              View My Trips
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/destinations")}
              className="w-full border-gold-accent text-gold-accent hover:bg-gold-accent hover:text-primary-foreground"
            >
              Explore More
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
