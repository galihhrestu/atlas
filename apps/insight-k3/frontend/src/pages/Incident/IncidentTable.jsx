import {incidentData} from "../../services/incidentData";


function IncidentTable(){


return(

<table className="incident-table">


<thead>

<tr>

<th>ID</th>
<th>Date</th>
<th>Category</th>
<th>Location</th>
<th>Severity</th>
<th>Status</th>

</tr>

</thead>



<tbody>


{
incidentData.incidents.map(
(item,index)=>(


<tr key={index}>


<td>
{item.id}
</td>


<td>
{item.date}
</td>


<td>
{item.category}
</td>


<td>
{item.location}
</td>


<td>
{item.severity}
</td>


<td>
{item.status}
</td>


</tr>


)

)
}


</tbody>



</table>


)

}


export default IncidentTable;