import "../../styles/dashboard.css";


function Home(){


return(

<div className="dashboard">


<div className="page-title">

<h1>
Executive Overview
</h1>

<p>
Integrated Safety Intelligence System
</p>


</div>




<div className="kpi-container">


<div className="kpi-card">

<h4>Total Incident</h4>

<h2>12</h2>

<span>This Year</span>

</div>



<div className="kpi-card">

<h4>TRIR</h4>

<h2>1.25</h2>

<span>Rate</span>

</div>



<div className="kpi-card">

<h4>LTIFR</h4>

<h2>0.35</h2>

<span>Frequency</span>

</div>



<div className="kpi-card">

<h4>Safety Score</h4>

<h2>94%</h2>

<span>Performance</span>

</div>


</div>




<div className="overview-grid">


<div className="panel">

<h3>
Safety Trend
</h3>

<div className="chart-placeholder">

Safety Performance Chart

</div>

</div>



<div className="panel">


<h3>
Risk Overview
</h3>


<p>
🔴 High Risk : 3
</p>

<p>
🟡 Medium Risk : 8
</p>

<p>
🟢 Low Risk : 15
</p>


</div>



</div>


</div>


)

}


export default Home;