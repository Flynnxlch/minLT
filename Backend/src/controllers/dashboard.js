/**
 * Dashboard controller - handles dashboard-related API endpoints
 */
export const dashboardController = {
  /**
   * Get dashboard statistics
   */
  getStats: async (request) => {
    const stats = {
      newOrders: 150,
      bounceRate: 53,
      userRegistrations: 44,
      uniqueVisitors: 65,
      totalRevenue: 12450,
      conversionRate: 3.2,
    };
    
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  },
  
  /**
   * Get chart data for dashboard
   */
  getChartData: async (request) => {
    const chartData = {
      salesValue: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
          {
            name: 'Digital Goods',
            data: [28, 48, 40, 19, 86, 27, 90],
          },
          {
            name: 'Electronics',
            data: [65, 59, 80, 81, 56, 55, 40],
          },
        ],
      },
      visitors: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: [1000, 1200, 920, 927, 931, 1027, 819],
      },
      browserUsage: [
        { browser: 'Google Chrome', percent: 80 },
        { browser: 'Mozilla Firefox', percent: 65 },
        { browser: 'Safari', percent: 45 },
        { browser: 'Microsoft Edge', percent: 30 },
      ],
    };
    
    return new Response(JSON.stringify(chartData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  },
  
  /**
   * Get notifications
   */
  getNotifications: async (request) => {
    const notifications = [
      { id: 1, icon: 'envelope', text: '4 new messages', time: '3 mins' },
      { id: 2, icon: 'people-fill', text: '8 friend requests', time: '12 hours' },
      { id: 3, icon: 'file-earmark-fill', text: '3 new reports', time: '2 days' },
    ];
    
    return new Response(JSON.stringify({ notifications, total: 15 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  },
  
  /**
   * Get messages
   */
  getMessages: async (request) => {
    const messages = [
      {
        id: 1,
        user: 'Brad Diesel',
        avatar: '/assets/img/user1-128x128.jpg',
        message: 'Call me whenever you can...',
        time: '4 Hours Ago',
        starred: true,
        starColor: 'danger',
      },
      {
        id: 2,
        user: 'John Pierce',
        avatar: '/assets/img/user8-128x128.jpg',
        message: 'I got your message bro',
        time: '4 Hours Ago',
        starred: true,
        starColor: 'secondary',
      },
      {
        id: 3,
        user: 'Nora Silvester',
        avatar: '/assets/img/user3-128x128.jpg',
        message: 'The subject goes here',
        time: '4 Hours Ago',
        starred: true,
        starColor: 'warning',
      },
    ];
    
    return new Response(JSON.stringify({ messages, total: 3 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

