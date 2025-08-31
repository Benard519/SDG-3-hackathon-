import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Heart, Shield, Star } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { BackgroundImage } from '../ui/BackgroundImage';
import { ANIMATION_VARIANTS } from '../../utils/constants';

interface SubscriptionPlansProps {
  onSelectPlan: (planId: string) => void;
}

// Subscription plans component for Stripe integration
export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onSelectPlan }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  const plans = [
    {
      id: 'free',
      name: 'Basic Care',
      price: 0,
      period: 'Forever',
      description: 'Essential features for small families',
      features: [
        'Up to 2 patients',
        'Basic health logging',
        'Simple reminders',
        'Emergency alerts',
        'Email support'
      ],
      icon: Heart,
      color: 'border-gray-200',
      buttonVariant: 'outline' as const,
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium Care',
      price: 35,
      period: 'month',
      description: 'Complete care management solution',
      features: [
        'Unlimited patients',
        'Advanced health analytics',
        'Smart medication reminders',
        'Real-time family updates',
        'Priority support',
        'Custom care plans',
        'Health trend reports',
        'Mobile app access'
      ],
      icon: Crown,
      color: 'border-blue-500 ring-2 ring-blue-200',
      buttonVariant: 'primary' as const,
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Care Facility',
      price: 99,
      period: 'month',
      description: 'For care facilities and organizations',
      features: [
        'Everything in Premium',
        'Multi-facility management',
        'Staff coordination tools',
        'Advanced reporting',
        'API access',
        'Custom integrations',
        'Dedicated support',
        'Training sessions'
      ],
      icon: Shield,
      color: 'border-purple-500',
      buttonVariant: 'secondary' as const,
      popular: false
    }
  ];

  return (
    <BackgroundImage>
      <div className="max-w-7xl mx-auto p-4 py-16">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS.fadeIn}
        >
          <motion.h1 
            className="text-6xl font-bold text-gray-900 mb-6"
            animate={{ 
              textShadow: [
                "0 0 0px rgba(59, 130, 246, 0)", 
                "0 0 30px rgba(59, 130, 246, 0.4)", 
                "0 0 0px rgba(59, 130, 246, 0)"
              ]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            Choose Your Care Plan
          </motion.h1>
          <motion.p 
            className="text-2xl text-gray-700 font-medium max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Compassionate elderly care management that grows with your family's needs
          </motion.p>
        </motion.div>

        {/* Pricing cards */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS.stagger}
        >
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            
            return (
              <motion.div
                key={plan.id}
                variants={ANIMATION_VARIANTS.fadeIn}
                className="relative"
              >
                {plan.popular && (
                  <motion.div
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <div className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </div>
                  </motion.div>
                )}
                
                <Card 
                  className={`h-full text-center relative ${plan.color} ${plan.popular ? 'scale-105' : ''}`}
                  glass={true}
                  hover={true}
                >
                  <div className="p-8">
                    {/* Plan icon */}
                    <motion.div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${
                        plan.popular ? 'bg-blue-100' : 'bg-gray-100'
                      }`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.8 }}
                    >
                      <Icon className={`w-8 h-8 ${plan.popular ? 'text-blue-600' : 'text-gray-600'}`} />
                    </motion.div>

                    {/* Plan name and description */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-6">{plan.description}</p>

                    {/* Pricing */}
                    <div className="mb-8">
                      <div className="flex items-baseline justify-center">
                        <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                        {plan.price > 0 && (
                          <span className="text-xl text-gray-600 ml-2">/{plan.period}</span>
                        )}
                      </div>
                      {plan.price === 0 && (
                        <p className="text-lg text-gray-600 mt-2">{plan.period}</p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <motion.div
                          key={featureIndex}
                          className="flex items-center text-left"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + featureIndex * 0.1 }}
                        >
                          <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Button
                      variant={plan.buttonVariant}
                      size="lg"
                      onClick={() => onSelectPlan(plan.id)}
                      className="w-full"
                    >
                      {plan.price === 0 ? 'Get Started Free' : 'Choose Plan'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          className="text-center mt-16"
          initial="hidden"
          animate="visible"
          variants={ANIMATION_VARIANTS.fadeIn}
        >
          <Card glass={true} className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">HIPAA Compliant</h3>
                <p className="text-gray-600">Your family's health data is secure and protected</p>
              </div>
              <div>
                <Heart className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Family Focused</h3>
                <p className="text-gray-600">Designed by caregivers, for caregivers and families</p>
              </div>
              <div>
                <Star className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">24/7 Support</h3>
                <p className="text-gray-600">Always here when you need help with care management</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </BackgroundImage>
  );
};