import { Alert, Button, Card, Col, Divider, Form, Image, Input, message, Row, Select, Space, Spin, Switch, TimePicker, Typography } from "antd";
import { DeleteOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { updateCompanyProfile } from "../../api/companyApi";
import { useCompany } from "../../company/CompanyContext";
const { Title, Text } = Typography;
const options = (arr) => arr.map((value) => ({ value, label: value }));
const TIMEZONES = options(["Asia/Colombo","Asia/Dubai","Asia/Kolkata","Asia/Singapore","Europe/London","America/New_York"]);
const CURRENCIES = options(["LKR","USD","EUR","GBP","AED","INR","SGD"]);
const DATE_FORMATS = options(["YYYY-MM-DD","DD/MM/YYYY","MM/DD/YYYY","DD-MMM-YYYY"]);
const THEMES = [{value:"system",label:"Follow system"},{value:"light",label:"Light"},{value:"dark",label:"Dark"}];
const LANGUAGES = [{value:"en",label:"English"},{value:"si",label:"Sinhala"},{value:"ta",label:"Tamil"}];
const UNITS = options(["m²","pieces","kg","tonnes","litres","m³","units"]);
const toTime = (v) => v ? dayjs(v,"HH:mm") : null;
export default function CompanyProfilePage() {
  const [form] = Form.useForm();
  const { company, loadingCompany, companyError, setCompany } = useCompany();
  const [saving, setSaving] = useState(false);
  const logoUrl = Form.useWatch(["branding","logoUrl"], form);
  useEffect(() => {
    if (!company) return;
    form.setFieldsValue({
      name: company.name, timezone: company.timezone, currency: company.currency,
      dateFormat: company.dateFormat, dashboardTheme: company.dashboardTheme,
      defaultLanguage: company.defaultLanguage,
      branding: { companyDisplayName: company.branding?.companyDisplayName || company.name, logoUrl: company.branding?.logoUrl || "" },
      productionUnits: { primary: company.productionUnits?.primary || "m²", available: company.productionUnits?.available || ["m²","pieces"] },
      shifts: (company.shifts || []).map((s) => ({ ...s, startTime: toTime(s.startTime), endTime: toTime(s.endTime) })),
    });
  }, [company, form]);
  async function save(values) {
    setSaving(true);
    try {
      const payload = { ...values, shifts: values.shifts.map((s) => ({ ...s, name: s.name.trim(), startTime: s.startTime.format("HH:mm"), endTime: s.endTime.format("HH:mm"), crossesMidnight: Boolean(s.crossesMidnight), enabled: s.enabled !== false })) };
      const result = await updateCompanyProfile(payload);
      setCompany(result.company); message.success("Company profile updated successfully");
    } catch (error) { message.error(error.message || "Unable to update company profile"); }
    finally { setSaving(false); }
  }
  if (loadingCompany) return <Card style={{minHeight:300,display:"grid",placeItems:"center"}}><Spin size="large" /></Card>;
  return <Card>
    <div className="page-heading"><div><Title level={2} style={{marginBottom:4}}>Company Profile</Title><Text type="secondary">Configure branding, regional settings, units and working shifts.</Text></div><Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => form.submit()}>Save Changes</Button></div>
    {companyError && <Alert type="error" showIcon message={companyError} style={{marginTop:20}} />}
    <Form form={form} layout="vertical" requiredMark={false} onFinish={save} style={{marginTop:28}}>
      <Title level={4}>Company branding</Title>
      <Row gutter={[20,0]}><Col xs={24} lg={12}>
        <Form.Item label="Legal company name" name="name" rules={[{required:true}]}><Input /></Form.Item>
        <Form.Item label="Dashboard display name" name={["branding","companyDisplayName"]} rules={[{required:true}]}><Input /></Form.Item>
        <Form.Item label="Company logo URL" name={["branding","logoUrl"]}><Input placeholder="https://example.com/logo.png" /></Form.Item>
      </Col><Col xs={24} lg={12}><Card size="small" title="Logo preview">{logoUrl ? <Image src={logoUrl} alt="Company logo" style={{maxHeight:150,objectFit:"contain"}} /> : <Text type="secondary">No logo configured</Text>}</Card></Col></Row>
      <Divider /><Title level={4}>Regional settings</Title>
      <Row gutter={[20,0]}><Col xs={24} md={12}><Form.Item label="Timezone" name="timezone" rules={[{required:true}]}><Select showSearch options={TIMEZONES} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Currency" name="currency" rules={[{required:true}]}><Select options={CURRENCIES} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Date format" name="dateFormat" rules={[{required:true}]}><Select options={DATE_FORMATS} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Default language" name="defaultLanguage" rules={[{required:true}]}><Select options={LANGUAGES} /></Form.Item></Col></Row>
      <Divider /><Title level={4}>Dashboard preferences</Title>
      <Row gutter={[20,0]}><Col xs={24} md={12}><Form.Item label="Dashboard theme" name="dashboardTheme" rules={[{required:true}]}><Select options={THEMES} /></Form.Item></Col><Col xs={24} md={12}><Form.Item label="Primary production unit" name={["productionUnits","primary"]} rules={[{required:true}]}><Select showSearch options={UNITS} /></Form.Item></Col><Col xs={24}><Form.Item label="Available production units" name={["productionUnits","available"]} rules={[{required:true}]}><Select mode="tags" options={UNITS} /></Form.Item></Col></Row>
      <Divider /><Title level={4}>Working shifts</Title>
      <Form.List name="shifts">{(fields,{add,remove}) => <Space direction="vertical" size={16} style={{width:"100%"}}>{fields.map(({key,name,...rest}) => <Card key={key} size="small"><Row gutter={[16,0]} align="middle"><Col xs={24} md={6}><Form.Item {...rest} label="Shift name" name={[name,"name"]} rules={[{required:true}]}><Input /></Form.Item></Col><Col xs={24} md={5}><Form.Item {...rest} label="Start" name={[name,"startTime"]} rules={[{required:true}]}><TimePicker format="HH:mm" style={{width:"100%"}} /></Form.Item></Col><Col xs={24} md={5}><Form.Item {...rest} label="End" name={[name,"endTime"]} rules={[{required:true}]}><TimePicker format="HH:mm" style={{width:"100%"}} /></Form.Item></Col><Col xs={12} md={3}><Form.Item {...rest} label="Overnight" name={[name,"crossesMidnight"]} valuePropName="checked"><Switch /></Form.Item></Col><Col xs={12} md={3}><Form.Item {...rest} label="Enabled" name={[name,"enabled"]} valuePropName="checked"><Switch /></Form.Item></Col><Col xs={24} md={2}><Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(name)} /></Col></Row></Card>)}<Button type="dashed" icon={<PlusOutlined />} block onClick={() => add({name:"",startTime:dayjs("06:00","HH:mm"),endTime:dayjs("14:00","HH:mm"),crossesMidnight:false,enabled:true})}>Add Shift</Button></Space>}</Form.List>
    </Form>
  </Card>;
}
