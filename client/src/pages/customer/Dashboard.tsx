import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  DollarSign,
  Calendar,
  FileText,
  Star,
  Activity
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface Stats {
  totalProjects: number;
  activeJobs: number;
  pendingBids: number;
  completedJobs: number;
}

interface Job {
  _id: string;
  title: string;
  status: string;
  budget: { min: number; max: number };
  createdAt: string;
  bidCount: number;
  project: { name: string };
}

interface Project {
  _id: string;
  name: string;
  status: string;
  progress: { percentage: number };
  budget: { estimated: number; spent: number };
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    activeJobs: 0,
    pendingBids: 0,
    completedJobs: 0,
  });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [jobsResponse, projectsResponse] = await Promise.all([
        api.jobs.getMyPostings(),
        api.projects.getAll(),
      ]);

      const jobs = (jobsResponse.data?.jobs || []) as Job[];
      const projects = (projectsResponse.data?.projects || []) as Project[];

      // Calculate stats
      const activeJobsCount = jobs.filter((j) => j.status === 'open' || j.status === 'in_progress').length;
      const completedJobsCount = jobs.filter((j) => j.status === 'completed').length;
      const pendingBidsCount = jobs.reduce((sum, j) => sum + (j.bidCount || 0), 0);

      setStats({
        totalProjects: projects.length,
        activeJobs: activeJobsCount,
        pendingBids: pendingBidsCount,
        completedJobs: completedJobsCount,
      });

      // Get recent jobs (last 5)
      setRecentJobs(jobs.slice(0, 5));

      // Get active projects
      setActiveProjects(projects.filter((p) => p.status === 'in_progress' || p.status === 'planning').slice(0, 4));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  const statCards = [
    {
      title: 'Active Projects',
      value: stats.totalProjects,
      icon: Briefcase,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      link: '/home',
    },
    {
      title: 'Active Jobs',
      value: stats.activeJobs,
      icon: Activity,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      link: '/customer/bids',
    },
    {
      title: 'Pending Bids',
      value: stats.pendingBids,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      link: '/customer/bids',
    },
    {
      title: 'Completed',
      value: stats.completedJobs,
      icon: CheckCircle,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      link: '/customer/bids',
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      open: 'bg-green-100 text-green-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700',
      assigned: 'bg-yellow-100 text-yellow-700',
      planning: 'bg-cyan-100 text-cyan-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#010101] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 xs:gap-4">
          <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 border-4 border-[#cfe0ad] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs xs:text-sm sm:text-base text-neutral-400 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#010101] pb-24 xs:pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a0a0a] border-b border-[#1f1f1f] sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-5 sm:py-6">
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4">
            <div>
              <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-white">Customer Dashboard</h1>
              <p className="text-xs xs:text-sm sm:text-base text-neutral-400 mt-0.5 xs:mt-1">Manage your projects and jobs</p>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/customer/post-job"
                className="inline-flex items-center justify-center gap-1.5 xs:gap-2 px-4 xs:px-5 sm:px-6 py-2 xs:py-2.5 sm:py-3 bg-[#cfe0ad] text-black text-sm xs:text-base font-medium rounded-lg hover:bg-[#bfd09d] transition-all min-h-[44px]"
              >
                <Plus className="w-4 h-4 xs:w-5 xs:h-5" />
                <span className="hidden xs:inline">Post New Job</span>
                <span className="xs:hidden">Post Job</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-6 sm:py-8">
        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 md:gap-6 mb-4 xs:mb-6 sm:mb-8"
        >
          {statCards.map((stat, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Link to={stat.link}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-[#101010] rounded-xl xs:rounded-2xl border border-[#1f1f1f] p-3 xs:p-4 sm:p-5 md:p-6 cursor-pointer hover:bg-[#151515] transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[0.65rem] xs:text-xs sm:text-sm font-medium text-neutral-400 truncate">{stat.title}</p>
                      <p className="text-xl xs:text-2xl sm:text-3xl font-bold text-white mt-1 xs:mt-2">{stat.value}</p>
                    </div>
                    <div className="bg-[#1a1a1a] p-2 xs:p-3 sm:p-4 rounded-lg xs:rounded-xl shrink-0">
                      <stat.icon className={`w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${stat.textColor}`} />
                    </div>
                  </div>
                  <div className={`mt-3 xs:mt-4 h-1.5 xs:h-2 bg-gradient-to-r ${stat.color} rounded-full`} />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-[#1a2a1a] to-[#0a150a] rounded-xl xs:rounded-2xl border border-[#2a2a2a] p-4 xs:p-5 sm:p-6 mb-4 xs:mb-6 sm:mb-8 text-white"
        >
          <h2 className="text-base xs:text-lg sm:text-xl font-bold mb-3 xs:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/customer/post-job"
                className="flex items-center gap-2 xs:gap-3 bg-[#cfe0ad]/10 backdrop-blur-sm rounded-lg xs:rounded-xl p-3 xs:p-4 hover:bg-[#cfe0ad]/20 transition-all border border-[#cfe0ad]/20 min-h-[44px]"
              >
                <Plus className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-[#cfe0ad]" />
                <span className="text-sm xs:text-base font-medium">Post a Job</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/customer/bids"
                className="flex items-center gap-2 xs:gap-3 bg-[#cfe0ad]/10 backdrop-blur-sm rounded-lg xs:rounded-xl p-3 xs:p-4 hover:bg-[#cfe0ad]/20 transition-all border border-[#cfe0ad]/20 min-h-[44px]"
              >
                <FileText className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-[#cfe0ad]" />
                <span className="text-sm xs:text-base font-medium">Review Bids</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/customer/progress"
                className="flex items-center gap-2 xs:gap-3 bg-[#cfe0ad]/10 backdrop-blur-sm rounded-lg xs:rounded-xl p-3 xs:p-4 hover:bg-[#cfe0ad]/20 transition-all border border-[#cfe0ad]/20 min-h-[44px]"
              >
                <Activity className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-[#cfe0ad]" />
                <span className="text-sm xs:text-base font-medium">Track Progress</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/hire-contractor"
                className="flex items-center gap-2 xs:gap-3 bg-[#cfe0ad]/10 backdrop-blur-sm rounded-lg xs:rounded-xl p-3 xs:p-4 hover:bg-[#cfe0ad]/20 transition-all border border-[#cfe0ad]/20 min-h-[44px]"
              >
                <Users className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-[#cfe0ad]" />
                <span className="text-sm xs:text-base font-medium">Find Contractors</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6 sm:gap-8">
          {/* Recent Jobs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#101010] rounded-xl xs:rounded-2xl border border-[#1f1f1f] p-4 xs:p-5 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4 xs:mb-5 sm:mb-6">
              <h2 className="text-base xs:text-lg sm:text-xl font-bold text-white">Recent Jobs</h2>
              <Link
                to="/customer/bids"
                className="text-[#cfe0ad] hover:underline font-medium flex items-center gap-1 text-xs xs:text-sm"
              >
                View All <ArrowRight className="w-3 h-3 xs:w-4 xs:h-4" />
              </Link>
            </div>

            {recentJobs.length === 0 ? (
              <div className="text-center py-8 xs:py-10 sm:py-12">
                <Briefcase className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 text-neutral-600 mx-auto mb-3 xs:mb-4" />
                <p className="text-xs xs:text-sm sm:text-base text-neutral-400 mb-3 xs:mb-4">No jobs posted yet</p>
                <Link
                  to="/customer/post-job"
                  className="inline-flex items-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-2 bg-[#cfe0ad] text-black text-xs xs:text-sm font-medium rounded-lg hover:bg-[#bfd09d] transition-colors min-h-[40px]"
                >
                  <Plus className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                  Post Your First Job
                </Link>
              </div>
            ) : (
              <div className="space-y-2 xs:space-y-3 sm:space-y-4">
                {recentJobs.map((job, index) => (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    className="border border-[#2a2a2a] rounded-lg xs:rounded-xl p-3 xs:p-4 hover:bg-[#151515] transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5 xs:mb-2">
                      <h3 className="text-sm xs:text-base font-semibold text-white line-clamp-1">{job.title}</h3>
                      <span className={`px-2 py-0.5 xs:py-1 rounded-full text-[0.6rem] xs:text-xs font-medium shrink-0 ${getStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs xs:text-sm text-neutral-400 mb-2 xs:mb-3 line-clamp-1">{job.project?.name}</p>
                    <div className="flex items-center justify-between text-xs xs:text-sm">
                      <span className="flex items-center gap-1 text-[#cfe0ad] font-medium">
                        <DollarSign className="w-3 h-3 xs:w-4 xs:h-4" />
                        <span className="hidden xs:inline">{formatCurrency(job.budget.min)} - {formatCurrency(job.budget.max)}</span>
                        <span className="xs:hidden">{formatCurrency(job.budget.min)}</span>
                      </span>
                      <span className="flex items-center gap-1 text-neutral-400">
                        <FileText className="w-3 h-3 xs:w-4 xs:h-4" />
                        {job.bidCount || 0} bids
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Active Projects */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#101010] rounded-xl xs:rounded-2xl border border-[#1f1f1f] p-4 xs:p-5 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4 xs:mb-5 sm:mb-6">
              <h2 className="text-base xs:text-lg sm:text-xl font-bold text-white">Active Projects</h2>
              <Link
                to="/home"
                className="text-[#cfe0ad] hover:underline font-medium flex items-center gap-1 text-xs xs:text-sm"
              >
                View All <ArrowRight className="w-3 h-3 xs:w-4 xs:h-4" />
              </Link>
            </div>

            {activeProjects.length === 0 ? (
              <div className="text-center py-8 xs:py-10 sm:py-12">
                <TrendingUp className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 text-neutral-600 mx-auto mb-3 xs:mb-4" />
                <p className="text-xs xs:text-sm sm:text-base text-neutral-400 mb-3 xs:mb-4">No active projects</p>
                <Link
                  to="/home"
                  className="inline-flex items-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-2 bg-[#cfe0ad] text-black text-xs xs:text-sm font-medium rounded-lg hover:bg-[#bfd09d] transition-colors min-h-[40px]"
                >
                  <Plus className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                  Create Your First Project
                </Link>
              </div>
            ) : (
              <div className="space-y-2 xs:space-y-3 sm:space-y-4">
                {activeProjects.map((project, index) => (
                  <motion.div
                    key={project._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    className="border border-[#2a2a2a] rounded-lg xs:rounded-xl p-3 xs:p-4 hover:bg-[#151515] transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2 xs:mb-3">
                      <h3 className="text-sm xs:text-base font-semibold text-white line-clamp-1">{project.name}</h3>
                      <span className={`px-2 py-0.5 xs:py-1 rounded-full text-[0.6rem] xs:text-xs font-medium shrink-0 ${getStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mb-2 xs:mb-3">
                      <div className="flex items-center justify-between text-xs xs:text-sm text-neutral-400 mb-1">
                        <span>Progress</span>
                        <span className="font-medium text-white">{project.progress?.percentage || 0}%</span>
                      </div>
                      <div className="w-full bg-[#1a1a1a] rounded-full h-1.5 xs:h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress?.percentage || 0}%` }}
                          transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                          className="bg-[#cfe0ad] h-full rounded-full"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs xs:text-sm">
                      <span className="flex items-center gap-1 text-neutral-400">
                        <DollarSign className="w-3 h-3 xs:w-4 xs:h-4" />
                        Budget: {formatCurrency(project.budget?.estimated || 0)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-4 xs:mt-6 sm:mt-8 bg-gradient-to-r from-[#1a1a0a] to-[#0a0a00] rounded-xl xs:rounded-2xl border border-[#3a3a2a] p-4 xs:p-5 sm:p-6"
        >
          <div className="flex items-start gap-3 xs:gap-4">
            <div className="bg-[#cfe0ad]/20 p-2 xs:p-3 rounded-lg shrink-0">
              <Star className="w-5 h-5 xs:w-6 xs:h-6 text-[#cfe0ad]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm xs:text-base sm:text-lg font-bold text-white mb-1.5 xs:mb-2">Pro Tips</h3>
              <ul className="space-y-1.5 xs:space-y-2 text-xs xs:text-sm text-neutral-300">
                <li className="flex items-start xs:items-center gap-1.5 xs:gap-2">
                  <CheckCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-[#cfe0ad] shrink-0 mt-0.5 xs:mt-0" />
                  <span>Post detailed job descriptions to attract quality contractors</span>
                </li>
                <li className="flex items-start xs:items-center gap-1.5 xs:gap-2">
                  <CheckCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-[#cfe0ad] shrink-0 mt-0.5 xs:mt-0" />
                  <span>Review contractor ratings and past work before accepting bids</span>
                </li>
                <li className="flex items-start xs:items-center gap-1.5 xs:gap-2">
                  <CheckCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-[#cfe0ad] shrink-0 mt-0.5 xs:mt-0" />
                  <span>Keep track of project progress through regular updates</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
