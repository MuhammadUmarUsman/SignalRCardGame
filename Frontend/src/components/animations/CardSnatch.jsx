import React, { useEffect, useState } from 'react';
import Card from '../cards/Card';
import './CardSnatch.css';

export default function CardSnatch({ startPos, endPos, card, onComplete }) {
    const [style, setStyle] = useState({
        left: startPos.x,
        top: startPos.y,
        transform: 'translate(-50%, -50%) scale(1)',
        opacity: 1
    });

    useEffect(() => {
        // Trigger animation after mount
        requestAnimationFrame(() => {
            setStyle({
                left: endPos.x,
                top: endPos.y,
                transform: 'translate(-50%, -50%) scale(0.5)',
                opacity: 0
            });
        });

        const timer = setTimeout(() => {
            onComplete();
        }, 600); // Match CSS transition duration

        return () => clearTimeout(timer);
    }, [endPos, onComplete]);

    return (
        <div className="card-snatch" style={style}>
            <Card rank={card.rank} suit={card.suit} />
        </div>
    );
}
