import React from 'react'
import { motion } from 'framer-motion'
import {
  Globe, FileSearch, Search, TrendingUp, Link2, AlertTriangle,
  CheckCircle, ArrowUpRight, ArrowDownRight, Minus, Activity
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useData } from '@/hooks/useData'
import { dashboardAPI } from '@/services/api'
import { formatDate, getScoreColor, cn } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export function Dashboard() {
  const { data: overview, isLoading } = useData(dashboardAPI.getOverview)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  const stats = overview?.data?.stats || {}
  const websites = overview?.data?.websites || []
  const recentAudits = overview?.data?.recent_audits || []
  const rankingDist = overview?.data?.ranking_distribution || {}
  const keywordsSummary = overview?.data?.keywords_summary || {}

  const rankingData = [
    { name: 'Top 3', value: rankingDist.top3 || 0, color: '#22c55e' },
    { name: 'Top 10', value: rankingDist.top10 || 0, color: '#3b82f6' },
    { name: 'Top 50', value: rankingDist.top50 || 0, color: '#f59e0b' },
    { name: 'Not Ranked', value: rankingDist.notRanked || 0, color: '#94a3b8' },
  ]

  const mockTrend = [
    { date: 'Mon', score: 65 },
    { date: 'Tue', score: 68 },
    { date: 'Wed', score: 72 },
    { date: 'Thu', score: 70 },
    { date: 'Fri', score: 75 },
    { date: 'Sat', score: 78 },
    { date: 'Sun', score: 82 },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4 sm:space-y-8"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          title="Websites"
          value={stats.websites || 0}
          icon={Globe}
          color="blue"
          delay={0}
        />
        <StatCard
          title="Total Audits"
          value={stats.audits || 0}
          icon={FileSearch}
          color="purple"
          delay={0.1}
        />
        <StatCard
          title="Keywords Tracked"
          value={stats.keywords || 0}
          icon={Search}
          color="green"
          delay={0.2}
        />
        <StatCard
          title="Backlinks"
          value={stats.backlinks || 0}
          icon={Link2}
          color="amber"
          delay={0.3}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* SEO Score Trend */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-dark-900">SEO Score Trend</h3>
                  <p className="text-sm text-dark-500">Average SEO health score over time</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-primary-600">{stats.avg_seo_score || 0}</span>
                  <span className="text-sm text-dark-400">/100</span>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="h-52 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockTrend}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fill="url(#scoreGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Ranking Distribution */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <h3 className="text-lg font-bold text-dark-900">Keyword Distribution</h3>
              <p className="text-sm text-dark-500">Ranking positions breakdown</p>
            </CardHeader>
            <CardBody className="flex flex-col items-center">
              <div className="h-40 sm:h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rankingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {rankingData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full mt-4">
                {rankingData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-dark-600">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Issues & Keywords Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Issues Summary */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-bold text-dark-900">Issues Overview</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-danger-50 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-danger-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-danger-600">{stats.critical_issues || 0}</p>
                  <p className="text-xs text-danger-500 font-medium">Critical</p>
                </div>
                <div className="text-center p-4 bg-warning-50 rounded-xl">
                  <Activity className="w-6 h-6 text-warning-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-warning-600">{stats.warnings || 0}</p>
                  <p className="text-xs text-warning-500 font-medium">Warnings</p>
                </div>
                <div className="text-center p-4 bg-success-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-success-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-success-600">
                    {Math.max(0, (stats.total_issues || 0) - (stats.critical_issues || 0) - (stats.warnings || 0))}
                  </p>
                  <p className="text-xs text-success-500 font-medium">Passed</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Keyword Performance */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-bold text-dark-900">Keyword Performance</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-600">Improved</span>
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-success-500" />
                    <span className="text-sm font-bold text-success-600">{keywordsSummary.improved || 0}</span>
                  </div>
                </div>
                <div className="w-full bg-dark-100 rounded-full h-2">
                  <div
                    className="bg-success-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${keywordsSummary.total ? (keywordsSummary.improved / keywordsSummary.total) * 100 : 0}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-600">Dropped</span>
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="w-4 h-4 text-danger-500" />
                    <span className="text-sm font-bold text-danger-600">{keywordsSummary.dropped || 0}</span>
                  </div>
                </div>
                <div className="w-full bg-dark-100 rounded-full h-2">
                  <div
                    className="bg-danger-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${keywordsSummary.total ? (keywordsSummary.dropped / keywordsSummary.total) * 100 : 0}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-600">Unchanged</span>
                  <div className="flex items-center gap-2">
                    <Minus className="w-4 h-4 text-dark-400" />
                    <span className="text-sm font-bold text-dark-600">{keywordsSummary.unchanged || 0}</span>
                  </div>
                </div>
                <div className="w-full bg-dark-100 rounded-full h-2">
                  <div
                    className="bg-dark-400 h-2 rounded-full transition-all"
                    style={{
                      width: `${keywordsSummary.total ? (keywordsSummary.unchanged / keywordsSummary.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark-900">Recent Audits</h3>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-dark-100/50">
              {recentAudits.length > 0 ? recentAudits.map((audit: any) => (
                <div key={audit.id} className="flex items-center justify-between px-6 py-4 hover:bg-dark-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      audit.status === 'completed' ? 'bg-success-50' : audit.status === 'failed' ? 'bg-danger-50' : 'bg-primary-50'
                    )}>
                      <FileSearch className={cn(
                        'w-5 h-5',
                        audit.status === 'completed' ? 'text-success-500' : audit.status === 'failed' ? 'text-danger-500' : 'text-primary-500'
                      )} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-dark-900">
                        {audit.website?.name || 'Website Audit'}
                      </p>
                      <p className="text-xs text-dark-500">{formatDate(audit.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {audit.seo_score !== undefined && (
                      <ScoreRing score={audit.seo_score} size="sm" />
                    )}
                    <Badge variant={
                      audit.status === 'completed' ? 'success' :
                      audit.status === 'failed' ? 'danger' : 'info'
                    }>
                      {audit.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-dark-500 text-sm">
                  No recent audits. Start by adding a website and running an audit.
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </motion.div>
  )
}