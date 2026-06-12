import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Tag, Modal, Input, message, Statistic, Card, Row, Col, Space, Tabs } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getDashboard, getReviews, approveReview, rejectReview, getUsers, setUserStatus, getAdminLogs } from '../../api/admin';
import { useAuthStore } from '../../store/authStore';
import type { ReviewItem, User, LogItem } from '../../types';

export default function AdminPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [tab, setTab] = useState('dashboard');

  const [dashboard, setDashboard] = useState({ pending_count: 0, total_users: 0, today_new: 0 });
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);

  const [rejectModal, setRejectModal] = useState<{ id: number; open: boolean }>({ id: 0, open: false });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    getDashboard().then((r) => setDashboard(r.data));
    getReviews().then((r) => setReviews(r.data));
    getUsers().then((r) => setUsers(r.data));
    getAdminLogs().then((r) => setLogs(r.data));
  }, []);

  const content = () => {
    switch (tab) {
      case 'dashboard':
        return (
          <Row gutter={16}>
            <Col span={8}><Card><Statistic title="待审核" value={dashboard.pending_count} valueStyle={{ color: '#faad14' }} /></Card></Col>
            <Col span={8}><Card><Statistic title="总用户数" value={dashboard.total_users} /></Card></Col>
            <Col span={8}><Card><Statistic title="今日新增" value={dashboard.today_new} valueStyle={{ color: '#52c41a' }} /></Card></Col>
          </Row>
        );
      case 'reviews':
        return (
          <Table dataSource={reviews} rowKey="id" size="small"
            columns={[
              { title: '提交时间', dataIndex: 'created_at', render: (v: string) => v?.slice(0, 10) },
              { title: '姓名', dataIndex: 'real_name' },
              { title: '手机号', dataIndex: 'phone', render: (v: string) => v?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') },
              { title: '邮箱', dataIndex: 'email' },
              { title: '单位', dataIndex: 'organization' },
              { title: '状态', dataIndex: 'status', render: (v: string) => {
                const m: Record<string, { c: string; t: string }> = {
                  pending: { c: 'orange', t: '待审核' },
                  active: { c: 'green', t: '已通过' },
                  approved: { c: 'green', t: '已通过' },
                  rejected: { c: 'red', t: '已拒绝' },
                  disabled: { c: 'red', t: '已禁用' },
                };
                return <Tag color={m[v]?.c || 'default'}>{m[v]?.t || v}</Tag>;
              }},
              { title: '操作', render: (_: any, r: ReviewItem) => (
                <Space>
                  {r.status === 'pending' ? (
                    <>
                      <Button type="link" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}
                        onClick={async (e) => { e.preventDefault(); try { await approveReview(r.id); message.success('已通过'); getReviews().then(setReviews); } catch { message.error('操作失败'); } }}>通过</Button>
                      <Button type="link" icon={<CloseCircleOutlined />} danger
                        onClick={() => setRejectModal({ id: r.id, open: true })}>拒绝</Button>
                    </>
                  ) : r.status === 'active' || r.status === 'approved' ? (
                    <Button type="link" danger
                      onClick={async (e) => { e.preventDefault(); try { await setUserStatus(r.id, 'disabled'); message.success('已禁用'); getReviews().then(setReviews); } catch { message.error('操作失败'); } }}>禁用</Button>
                  ) : null}
                </Space>
              )}
            ]}
          />
        );
      case 'users':
        return (
          <Table dataSource={users} rowKey="id" size="small"
            columns={[
              { title: '注册时间', dataIndex: 'created_at', render: (v: string) => v?.slice(0, 10) },
              { title: '姓名', dataIndex: 'real_name' },
              { title: '手机号', dataIndex: 'phone', render: (v: string) => v?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') },
              { title: '邮箱', dataIndex: 'email' },
              { title: '单位', dataIndex: 'organization' },
              { title: '状态', dataIndex: 'status', render: (v: string) => {
                const m: Record<string, { c: string; t: string }> = { active: { c: 'green', t: '正常' }, disabled: { c: 'red', t: '禁用' }, pending: { c: 'orange', t: '待审核' } };
                return <Tag color={m[v]?.c}>{m[v]?.t}</Tag>;
              }},
              { title: '操作', render: (_: any, r: User) => (
                <Space>
                  <Button type="link" onClick={() => Modal.info({ title: '用户详情', width: 600, content: <pre>{JSON.stringify(r, null, 2)}</pre> })}>详情</Button>
                  {r.status === 'active' ? (
                    <Button type="link" danger onClick={async (e) => { e.preventDefault(); try { await setUserStatus(r.id, 'disabled'); message.success('已禁用'); getUsers().then(setUsers); } catch { message.error('操作失败'); } }}>禁用</Button>
                  ) : (
                    <Button type="link" style={{ color: '#52c41a' }} onClick={async (e) => { e.preventDefault(); try { await setUserStatus(r.id, 'active'); message.success('已启用'); getUsers().then(setUsers); } catch { message.error('操作失败'); } }}>启用</Button>
                  )}
                </Space>
              )}
            ]}
          />
        );
      case 'logs':
        return (
          <Table dataSource={logs} rowKey="id" size="small"
            columns={[
              { title: '时间', dataIndex: 'created_at', render: (v: string) => v?.slice(0, 16) },
              { title: '用户', dataIndex: 'user_name' },
              { title: '操作', dataIndex: 'action' },
              { title: '详情', dataIndex: 'detail' },
              { title: 'IP', dataIndex: 'ip', width: 130 },
            ]}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/chat')} />
          <span className="font-medium">管理后台</span>
        </div>
        <Space>
          <Button size="small" onClick={() => navigate('/chat')}>💬 智能对话</Button>
          <Button size="small" onClick={() => { logout(); navigate('/login'); }}>退出登录</Button>
        </Space>
      </div>
      <div className="max-w-5xl mx-auto p-6">
        <Tabs activeKey={tab} onChange={setTab}
          tabBarExtraContent={<span className="text-xs text-gray-400">管理员</span>}
          items={[
            { key: 'dashboard', label: '📊 仪表盘' },
            { key: 'reviews', label: '📋 审核管理' },
            { key: 'users', label: '👥 用户管理' },
            { key: 'logs', label: '📊 日志管理' },
          ]}
        />
        {content()}
      </div>

      <Modal title="拒绝原因" open={rejectModal.open} onCancel={() => setRejectModal({ id: 0, open: false })} onOk={async () => {
        if (!rejectReason) { message.warning('请输入拒绝原因'); return; }
        await rejectReview(rejectModal.id, rejectReason);
        message.success('已拒绝');
        setRejectModal({ id: 0, open: false });
        setRejectReason('');
        getReviews().then(setReviews);
      }}>
        <Input.TextArea placeholder="请输入拒绝原因" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
      </Modal>
    </div>
  );
}
