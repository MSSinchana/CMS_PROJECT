def estimate_energy_and_co2(
    execution_time_ms: float,
    cpu_percent: float,
    memory_mb: float,
    cpu_base_power_watts: float,
    memory_power_watts_per_gb: float,
    grid_emission_factor_g_per_kwh: float,
) -> tuple[float, float, str]:
    seconds = max(0.0, execution_time_ms / 1000)
    cpu_power = cpu_base_power_watts * max(0.0, cpu_percent) / 100
    memory_gb = max(0.0, memory_mb) / 1024
    memory_power = memory_power_watts_per_gb * memory_gb

    energy_wh = (cpu_power + memory_power) * seconds / 3600
    co2_g = energy_wh * (grid_emission_factor_g_per_kwh / 1000)

    assumptions = (
        "Estimated values only. Assumptions: CPU power scales linearly with utilization "
        f"from base {cpu_base_power_watts}W, memory power {memory_power_watts_per_gb}W/GB, "
        f"grid emission factor {grid_emission_factor_g_per_kwh} gCO2/kWh."
    )
    return round(energy_wh, 6), round(co2_g, 6), assumptions
