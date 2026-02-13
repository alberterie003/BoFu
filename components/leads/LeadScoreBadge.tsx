import { Flame, CircleDot, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadScoreBadgeProps {
    score?: number;
    tier?: 'hot' | 'warm' | 'cold';
    showScore?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function LeadScoreBadge({ score, tier, showScore = true, size = 'md' }: LeadScoreBadgeProps) {
    // If no tier provided, calculate from score
    const qualityTier = tier || (score && score >= 70 ? 'hot' : score && score >= 40 ? 'warm' : 'cold');

    if (!score && !tier) {
        return (
            <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                size === 'sm' && 'px-1.5 py-0.5 text-[10px]',
                size === 'lg' && 'px-3 py-1.5 text-sm'
            )}>
                <CircleDot className={cn("h-3 w-3", size === 'sm' && 'h-2 w-2', size === 'lg' && 'h-4 w-4')} />
                <span>Not Scored</span>
            </span>
        );
    }

    const config = {
        hot: {
            icon: Flame,
            bgClass: 'bg-red-100 dark:bg-red-950',
            textClass: 'text-red-700 dark:text-red-400',
            iconClass: 'text-red-600 dark:text-red-500',
            label: 'Hot Lead'
        },
        warm: {
            icon: CircleDot,
            bgClass: 'bg-yellow-100 dark:bg-yellow-950',
            textClass: 'text-yellow-700 dark:text-yellow-400',
            iconClass: 'text-yellow-600 dark:text-yellow-500',
            label: 'Warm Lead'
        },
        cold: {
            icon: Snowflake,
            bgClass: 'bg-blue-100 dark:bg-blue-950',
            textClass: 'text-blue-700 dark:text-blue-400',
            iconClass: 'text-blue-600 dark:text-blue-500',
            label: 'Cold Lead'
        }
    };

    const { icon: Icon, bgClass, textClass, iconClass, label } = config[qualityTier];

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            bgClass,
            textClass,
            size === 'sm' && 'gap-1 px-1.5 py-0.5 text-[10px]',
            size === 'lg' && 'gap-2 px-3 py-1.5 text-sm'
        )}>
            <Icon className={cn(
                "h-3.5 w-3.5",
                iconClass,
                size === 'sm' && 'h-2.5 w-2.5',
                size === 'lg' && 'h-4 w-4'
            )} />
            <span>{showScore && score ? `${score}` : label}</span>
        </span>
    );
}

// Score breakdown tooltip component
export function ScoreBreakdown({ scores }: { scores: any }) {
    if (!scores) return null;

    return (
        <div className="space-y-2 text-xs">
            <div className="font-semibold">Score Breakdown:</div>
            <div className="space-y-1">
                <ScoreItem label="Timeline" score={scores.timeline_score} max={30} />
                <ScoreItem label="Financial Ready" score={scores.financial_ready_score} max={30} />
                <ScoreItem label="Specificity" score={scores.specificity_score} max={25} />
                <ScoreItem label="Engagement" score={scores.engagement_score} max={15} />
                <ScoreItem label="Response Speed" score={scores.response_speed_score} max={10} />
            </div>
            <div className="border-t pt-2 font-semibold">
                Total: {scores.total_score || 0}/100
            </div>
        </div>
    );
}

function ScoreItem({ label, score, max }: { label: string; score?: number; max: number }) {
    const value = score || 0;
    const percentage = (value / max) * 100;

    return (
        <div>
            <div className="flex justify-between mb-0.5">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}/{max}</span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
