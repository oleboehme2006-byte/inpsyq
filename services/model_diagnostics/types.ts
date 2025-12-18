export type DriftType = 'entropy_decay' | 'construct_saturation' | 'norm_drift';

export interface DiagnosticAlert {
    type: DriftType;
    severity: 'warning' | 'critical';
    message: string;
    metric_value: number;
}
