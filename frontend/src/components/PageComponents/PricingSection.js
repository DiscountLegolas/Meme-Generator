import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaCheck, FaCrown, FaRocket, FaBuilding } from 'react-icons/fa';

const PricingContainer = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 40px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 2.5rem;
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 30px;
`;

const PricingCard = styled(motion.div)`
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border-radius: 15px;
  padding: 30px;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-10px);
    border-color: #667eea;
    box-shadow: 0 15px 30px rgba(102, 126, 234, 0.3);
  }
  
  &.featured {
    border-color: #667eea;
    transform: scale(1.05);
  }
  
  &.featured::before {
    content: "Most Popular";
    position: absolute;
    top: 15px;
    right: -30px;
    background: #667eea;
    color: white;
    padding: 5px 40px;
    transform: rotate(45deg);
    font-size: 0.8rem;
    font-weight: bold;
  }
`;

const PlanIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: #667eea;
`;

const PlanName = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: #333;
`;

const Price = styled.div`
  font-size: 3rem;
  font-weight: bold;
  color: #667eea;
  margin: 20px 0;
  
  .currency {
    font-size: 1.5rem;
    vertical-align: top;
  }
  
  .period {
    font-size: 1rem;
    color: #666;
  }
`;

const Features = styled.ul`
  list-style: none;
  margin: 20px 0;
`;

const Feature = styled.li`
  padding: 8px 0;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  svg {
    color: #28a745;
  }
`;

const Button = styled.button`
  background: ${props => props.variant === 'secondary' 
    ? 'linear-gradient(135deg, #6c757d, #495057)' 
    : 'linear-gradient(135deg, #667eea, #764ba2)'};
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
  }
`;

const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    icon: <FaCheck />,
    price: 0,
    features: [
      '5 memes per day',
      'Basic templates',
      'Standard quality',
      'Community support'
    ],
    buttonText: 'Current Plan',
    variant: 'secondary'
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: <FaCrown />,
    price: 9.99,
    features: [
      'Unlimited memes',
      'All templates',
      'HD quality',
      'Priority support',
      'Custom captions'
    ],
    buttonText: 'Upgrade to Pro',
    featured: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: <FaBuilding />,
    price: 29.99,
    features: [
      'Everything in Pro',
      'API access',
      'Bulk generation',
      'White-label options',
      'Dedicated support'
    ],
    buttonText: 'Contact Sales',
    variant: 'secondary'
  }
];

function PricingSection() {
  const handlePlanClick = (plan) => {
    if (plan.id === 'pro') {
      alert('Pro plan features coming soon! This is a demo.');
    } else if (plan.id === 'enterprise') {
      alert('Enterprise plan features coming soon! This is a demo.');
    }
  };

  return (
    <PricingContainer
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      <Title>Choose Your Plan</Title>
      <PricingGrid>
        {pricingPlans.map((plan, index) => (
          <PricingCard
            key={plan.id}
            className={plan.featured ? 'featured' : ''}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
            onClick={() => handlePlanClick(plan)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlanIcon>{plan.icon}</PlanIcon>
            <PlanName>{plan.name}</PlanName>
            <Price>
              <span className="currency">$</span>
              {plan.price}
              <span className="period">/month</span>
            </Price>
            <Features>
              {plan.features.map((feature, idx) => (
                <Feature key={idx}>
                  <FaCheck />
                  {feature}
                </Feature>
              ))}
            </Features>
            <Button variant={plan.variant}>
              {plan.buttonText}
            </Button>
          </PricingCard>
        ))}
      </PricingGrid>
    </PricingContainer>
  );
}

export default PricingSection;
