import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function RegisterSuccess() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0958D9] to-[#1677FF]">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-[500px] text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">申请提交成功</h1>
        <p className="text-gray-500 mb-6">您的内测申请已提交，平台将在1-3个工作日内完成审核，请留意您的邮箱或短信通知。</p>
        <Button type="primary" size="large" onClick={() => navigate('/login')}>返回首页</Button>
      </div>
    </div>
  );
}
