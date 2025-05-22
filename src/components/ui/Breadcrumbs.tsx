import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Breadcrumb: React.FC = () => {
  const location = useLocation();

  // Split the pathname into segments
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="text-sm text-gray-500 mb-2">
      <Link to="/" className="hover:underline text-blue-500">
        Home
      </Link>
      {pathnames.map((value, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        return (
          <span key={index} className="text-gray-700">
            {' / '}
            {isLast ? (
              <span className="font-semibold">{value}</span>
            ) : (
              <Link to={routeTo} className="hover:underline text-blue-500">
                {value}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
