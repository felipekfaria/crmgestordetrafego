
import React from "react";
import { Bell, Check } from "lucide-react";
import { Lead } from "./LeadCard";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FollowUpAlertProps {
  leads: Lead[];
  onFilterChange?: (showOverdue: boolean) => void;
  className?: string;
}

export const getOverdueFollowUps = (leads: Lead[]): Lead[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return leads.filter(lead => {
    if (!lead.followUpDate) return false;
    
    const followUpDate = new Date(lead.followUpDate);
    followUpDate.setHours(0, 0, 0, 0);
    
    return followUpDate < today;
  });
};

const FollowUpAlert: React.FC<FollowUpAlertProps> = ({ 
  leads, 
  onFilterChange,
  className = "" 
}) => {
  const navigate = useNavigate();
  const overdueLeads = getOverdueFollowUps(leads);
  const overdueCount = overdueLeads.length;
  
  const handleClick = () => {
    if (onFilterChange) {
      // We're on the page with a filter, so just apply the filter
      onFilterChange(true);
    } else {
      // Navigate to the leads page with filter query param
      navigate("/leads?filter=overdue");
    }
  };
  
  if (overdueCount === 0) {
    return (
      <Alert className={`bg-green-50 border-green-200 flex items-center ${className}`}>
        <Check className="h-4 w-4 text-green-500 mr-2" />
        <AlertDescription className="text-green-700">
          ✅ Todos os follow-ups estão em dia
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Alert 
      className={`bg-yellow-50 border-yellow-200 hover:bg-yellow-100 transition-colors cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <Bell className="h-4 w-4 text-yellow-500 mr-2" />
          <AlertDescription className="text-yellow-700">
            ⚠️ Você tem {overdueCount} follow-up{overdueCount > 1 ? 's' : ''} vencido{overdueCount > 1 ? 's' : ''} hoje
          </AlertDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-yellow-700 hover:text-yellow-800 hover:bg-yellow-200"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          Ver agora
        </Button>
      </div>
    </Alert>
  );
};

export default FollowUpAlert;
