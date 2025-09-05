import React from 'react';

type PageHeaderProps = {
    title: string;
    subtitle?: string;
    icon?: React.ElementType;
    actions?: React.ReactNode;
    rightContent?: React.ReactNode;
    className?: string;
};

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon: Icon, actions, rightContent, className }) => {
    return (
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-5 text-white shadow-2xl ${className || ''}`}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            <div className="relative z-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center gap-4">
                        {Icon && (
                            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                                <Icon className="h-7 w-7 text-white" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-blue-100 mt-2 text-lg">{subtitle}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
                        {rightContent}
                        {actions}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageHeader;


