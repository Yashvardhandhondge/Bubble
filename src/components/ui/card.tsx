import React from 'react';

interface CardProps {
	children: React.ReactNode;
	className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
	return (
		<div className={`p-4 rounded-lg shadow-md bg-white ${className}`}>
			{children}
		</div>
	);
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
	return (
		<div className={`border-b pb-2 mb-4 ${className}`}>
			{children}
		</div>
	);
};

export const CardTitle: React.FC<CardProps> = ({ children, className = '' }) => {
	return <h2 className={`text-xl font-bold ${className}`}>{children}</h2>;
};

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => {
	return <div className={`text-gray-800 ${className}`}>{children}</div>;
};
