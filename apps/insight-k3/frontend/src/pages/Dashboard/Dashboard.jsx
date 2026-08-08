import { useState } from "react";


import { incidentData } from "../../services/incidentData";


import IncidentTrend from "../../components/charts/IncidentTrend";
import CausePie from "../../components/charts/CausePie";
import LocationBar from "../../components/charts/LocationBar";
import TimeFilter from "../../components/filter/TimeFilter";


import "../../styles/dashboard.css";



function Dashboard(){



const [period,setPeriod] = useState("1 Year");



const incidentByPeriod = {

    "1 Year":21,

    "6 Month":14,

    "3 Month":9,

    "1 Month":5,

    "2 Weeks":3,

    "1 Week":1

};



const totalIncident = incidentByPeriod[period];



const highRisk = 9;
const mediumRisk = 8;
const lowRisk = 3;





return(


<div className="dashboard">





{/* PAGE TITLE */}


<div className="page-title">


<h1>
EXECUTIVE OVERVIEW
</h1>


<p>
Detailed Safety Analytics
</p>


</div>









{/* KPI SECTION */}



<div className="kpi-container">





<div className="kpi-card">


<h3>
Total Incident
</h3>



<h1>
{totalIncident}
</h1>



<TimeFilter
onChange={setPeriod}
/>



</div>








<div className="kpi-card">


<h3>
High Risk
</h3>


<h1>
{highRisk}
</h1>


<p>
Critical Attention
</p>


</div>








<div className="kpi-card">


<h3>
Medium Risk
</h3>


<h1>
{mediumRisk}
</h1>


<p>
Monitoring
</p>


</div>








<div className="kpi-card">


<h3>
Low Risk
</h3>


<h1>
{lowRisk}
</h1>


<p>
Controlled
</p>


</div>





</div>









{/* INCIDENT TREND */}



<div className="chart-box">


<h2>
Incident Trend Analysis
</h2>




<div className="chart-container">


<IncidentTrend />


</div>



</div>









{/* ROOT CAUSE + LOCATION */}



<div className="analysis-grid">





<div className="chart-box">


<h2>
Root Cause Analysis
</h2>


<CausePie />


</div>








<div className="chart-box">


<h2>
Incident Location Distribution
</h2>


<LocationBar />


</div>





</div>









{/* SUMMARY TABLE */}




<div className="chart-box">



<h2>
Incident Cause Summary
</h2>





<div className="responsive-table-wrapper">

<table className="incident-table">





<thead>

<tr>


<th>
Main Cause
</th>


<th>
Number of Cases
</th>


<th>
Percentage
</th>


</tr>


</thead>







<tbody>


{

incidentData.cause.map(

(item,index)=>{


const percentage =

(
item.value / totalIncident * 100
).toFixed(1);



return(


<tr key={index}>


<td>
{item.name}
</td>


<td>
{item.value}
</td>


<td>
{percentage}%
</td>


</tr>


)


}


)


}



</tbody>





</table>

</div>




</div>







</div>



)


}



export default Dashboard;