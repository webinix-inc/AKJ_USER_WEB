import React, { useState, useEffect } from 'react';
import { List, Typography } from 'antd';
import { MdFiberNew } from 'react-icons/md'; // Specifically using MdFiberNew for "new"
import api from '../../api/axios';
import moment from 'moment';

const ImportantLinkSection = () => {
  const [links, setLinks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await api.get('/admin/importantLinks');
        if (response.status === 200) {
          setLinks(response.data.links.map(link => ({
            ...link,
            date: moment(link.createdAt).format('MMMM D, YYYY'),
            time: moment(link.createdAt).format('h:mm:ss A') 
          })));
        }
      } catch (error) {
        console.error('Error fetching important links:', error);
        setError('Failed to load important links');
      }
    };
  
    fetchLinks();
  }, []);

  if (error) {
    return (
      <Typography.Text type="danger" style={{ display: 'block', textAlign: 'center', marginTop: '20px' }}>
        {error}
      </Typography.Text>
    );
  }

  return (
    <div className="w-full">
      {/* Clear Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-[#023d50] mb-2">
          Important Announcements
        </h3>
        <div className="w-16 h-1 bg-gradient-to-r from-[#fc9721] to-[#ff953a] rounded-full"></div>
      </div>

      {links.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {links.map((link) => (
            <div
              key={link._id}
              className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl p-4 border-l-4 border-[#fc9721] hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => window.open(link.url, '_blank')}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[#023d50] font-semibold text-sm leading-tight group-hover:text-[#0086b2] transition-colors duration-300 mb-2">
                    {link.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#fc9721] text-white">
                      New
                    </span>
                    <p className="text-gray-600 text-xs">
                      {link.date}
                    </p>
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-3 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-8 h-8 bg-[#023d50] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">→</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl text-gray-400">📢</span>
          </div>
          <h4 className="text-[#023d50] font-medium mb-1">No Announcements</h4>
          <p className="text-gray-500 text-sm">Check back later for important updates</p>
        </div>
      )}
    </div>
  );
};

export default ImportantLinkSection;
