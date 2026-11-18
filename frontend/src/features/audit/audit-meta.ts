import type {
  AuditCategory,
  AuditSeverity,
  ComplianceFramework,
  ComplianceStatus,
} from '@/types';

export const auditCategoryLabels: Record<AuditCategory, string> = {
  access: 'Access',
  data: 'Data',
  integration: 'Integrations',
  security: 'Security',
  compliance: 'Compliance',
};

export const auditSeverityLabels: Record<AuditSeverity, string> = {
  info: 'Info',
  warning: 'Warning',
  critical: 'Critical',
};

export const severityVariant: Record<
  AuditSeverity,
  'info' | 'warning' | 'danger'
> = {
  info: 'info',
  warning: 'warning',
  critical: 'danger',
};

export const frameworkLabels: Record<ComplianceFramework, string> = {
  gdpr: 'GDPR',
  soc2: 'SOC 2',
  iso27001: 'ISO 27001',
  hipaa: 'HIPAA',
};

export const complianceStatusLabels: Record<ComplianceStatus, string> = {
  passing: 'Passing',
  attention: 'Needs attention',
  failing: 'Failing',
};

export const statusVariant: Record<
  ComplianceStatus,
  'success' | 'warning' | 'danger'
> = {
  passing: 'success',
  attention: 'warning',
  failing: 'danger',
};
