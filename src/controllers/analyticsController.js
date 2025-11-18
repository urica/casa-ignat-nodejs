const AnalyticsEvent = require('../models/AnalyticsEvent');
const AuditLog = require('../models/AuditLog');

/**
 * Analytics Controller
 * Handles analytics dashboard and reporting
 */

/**
 * Show analytics dashboard
 */
exports.showDashboard = async (req, res) => {
  try {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get basic stats
    const [
      totalEvents,
      todayEvents,
      weekEvents,
      monthEvents,
      topPages,
      recentConversions,
    ] = await Promise.all([
      AnalyticsEvent.countDocuments(),
      AnalyticsEvent.countDocuments({ timestamp: { $gte: new Date().setHours(0, 0, 0, 0) } }),
      AnalyticsEvent.countDocuments({ timestamp: { $gte: last7Days } }),
      AnalyticsEvent.countDocuments({ timestamp: { $gte: last30Days } }),
      AnalyticsEvent.getTopPages(last7Days, now, 10),
      AnalyticsEvent.find({ isConversion: true })
        .sort({ timestamp: -1 })
        .limit(20)
        .select('eventName conversionValue timestamp properties'),
    ]);

    // Get conversion funnel
    const conversionFunnel = await AnalyticsEvent.getConversionFunnel(last7Days, now);

    // Get device breakdown
    const deviceBreakdown = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: last7Days },
          'device.type': { $exists: true },
        },
      },
      {
        $group: {
          _id: '$device.type',
          count: { $sum: 1 },
        },
      },
    ]);

    res.render('admin/analytics/dashboard', {
      title: 'Dashboard Analytics',
      stats: {
        total: totalEvents,
        today: todayEvents,
        week: weekEvents,
        month: monthEvents,
      },
      topPages,
      recentConversions,
      conversionFunnel,
      deviceBreakdown,
    });
  } catch (error) {
    console.error('Error loading analytics dashboard:', error);
    req.flash('error', 'Eroare la încărcarea dashboard-ului');
    res.redirect('/admin');
  }
};

/**
 * Get real-time visitors
 */
exports.getRealTimeVisitors = async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const activeVisitors = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: fiveMinutesAgo },
          eventCategory: 'page_view',
        },
      },
      {
        $group: {
          _id: '$sessionId',
          lastActivity: { $max: '$timestamp' },
          currentPage: { $last: '$url' },
        },
      },
    ]);

    res.json({
      success: true,
      count: activeVisitors.length,
      visitors: activeVisitors,
    });
  } catch (error) {
    console.error('Error getting real-time visitors:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la obținerea vizitatorilor activi',
    });
  }
};

/**
 * Get traffic sources
 */
exports.getTrafficSources = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const sources = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: start, $lte: end },
          eventCategory: 'page_view',
          referrer: { $exists: true, $ne: '' },
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $regexMatch: { input: '$referrer', regex: 'google' } },
              'Google',
              {
                $cond: [
                  { $regexMatch: { input: '$referrer', regex: 'facebook' } },
                  'Facebook',
                  {
                    $cond: [
                      { $regexMatch: { input: '$referrer', regex: 'instagram' } },
                      'Instagram',
                      'Other',
                    ],
                  },
                ],
              },
            ],
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get direct traffic (no referrer)
    const directTraffic = await AnalyticsEvent.countDocuments({
      timestamp: { $gte: start, $lte: end },
      eventCategory: 'page_view',
      $or: [
        { referrer: { $exists: false } },
        { referrer: '' },
      ],
    });

    sources.unshift({
      _id: 'Direct',
      count: directTraffic,
    });

    res.json({
      success: true,
      sources,
    });
  } catch (error) {
    console.error('Error getting traffic sources:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la obținerea surselor de trafic',
    });
  }
};

/**
 * Get conversion report
 */
exports.getConversionReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const conversions = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: start, $lte: end },
          isConversion: true,
        },
      },
      {
        $group: {
          _id: {
            eventName: '$eventName',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          },
          count: { $sum: 1 },
          totalValue: { $sum: '$conversionValue' },
        },
      },
      {
        $group: {
          _id: '$_id.eventName',
          dailyConversions: {
            $push: {
              date: '$_id.date',
              count: '$count',
              value: '$totalValue',
            },
          },
          totalCount: { $sum: '$count' },
          totalValue: { $sum: '$totalValue' },
        },
      },
      { $sort: { totalCount: -1 } },
    ]);

    res.json({
      success: true,
      conversions,
    });
  } catch (error) {
    console.error('Error getting conversion report:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la generarea raportului de conversii',
    });
  }
};

/**
 * Track custom event (API endpoint)
 */
exports.trackEvent = async (req, res) => {
  try {
    const {
      eventName,
      eventCategory,
      properties,
      isConversion,
      conversionValue,
    } = req.body;

    if (!eventName) {
      return res.status(400).json({
        success: false,
        message: 'Event name is required',
      });
    }

    const eventData = {
      eventName,
      eventCategory: eventCategory || 'custom',
      properties,
      userId: req.user?.id,
      sessionId: req.session?.id,
      url: req.get('referer') || req.originalUrl,
      referrer: req.get('referrer'),
      userAgent: req.get('user-agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      isConversion: isConversion || false,
      conversionValue: conversionValue || 0,
    };

    await AnalyticsEvent.trackEvent(eventData);

    res.json({
      success: true,
      message: 'Event tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking custom event:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking event',
    });
  }
};

/**
 * Export analytics data
 */
exports.exportData = async (req, res) => {
  try {
    const { startDate, endDate, format } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const events = await AnalyticsEvent.find({
      timestamp: { $gte: start, $lte: end },
    })
      .select('eventName eventCategory timestamp properties conversionValue')
      .lean();

    if (format === 'csv') {
      // Convert to CSV
      const csv = [
        'Date,Event Name,Category,Value',
        ...events.map(e =>
          `${e.timestamp.toISOString()},${e.eventName},${e.eventCategory},${e.conversionValue || 0}`
        ),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.csv');
      res.send(csv);
    } else {
      // JSON format
      res.json({
        success: true,
        data: events,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting data',
    });
  }
};

module.exports = exports;
