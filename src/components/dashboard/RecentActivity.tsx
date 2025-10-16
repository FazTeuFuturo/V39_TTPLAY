// src/components/dashboard/RecentActivity.tsx

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'

export function RecentActivity() {
    // No futuro, estes dados virão de uma API
    const mockMatches = [
        { id: 1, opponent: 'João Silva', result: 'win', score: '3-1', ratingChange: '+15' },
        { id: 2, opponent: 'Maria Santos', result: 'loss', score: '1-3', ratingChange: '-12' }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Atividade Recente
                </CardTitle>
                <CardDescription>
                    Suas últimas partidas e resultados
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {mockMatches.map(match => (
                        <div key={match.id} className={`flex items-center justify-between p-3 rounded-lg ${match.result === 'win' ? 'bg-green-50' : 'bg-red-50'}`}>
                            <div>
                                <p className="font-medium">{match.result === 'win' ? 'Vitória' : 'Derrota'} vs {match.opponent}</p>
                                <p className="text-sm text-gray-500">{match.score}</p>
                            </div>
                            <Badge className={match.result === 'win' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {match.ratingChange}
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}