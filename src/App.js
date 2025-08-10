import React from 'react';
import ParadiseFlowDashboard from './paradise_flow_dashboard_interactive';
import './index.css';

// CSV 파싱 테스트 (개발용)
import { testParsing } from './testCSVParsing';

function App() {
  React.useEffect(() => {
    // 앱 시작 시 CSV 파싱 테스트 실행
    console.log('앱 시작 - CSV 파싱 테스트 실행');
    testParsing();
  }, []);
  
  return (
    <div className="App">
      <ParadiseFlowDashboard />
    </div>
  );
}

export default App;