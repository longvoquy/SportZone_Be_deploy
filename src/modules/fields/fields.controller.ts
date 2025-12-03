import { Controller, Get, Query, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { FieldsService } from './fields.service';
import { FieldsDto } from './dtos/fields.dto';

@ApiTags('Fields')
@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all fields with filtering' })
  @ApiResponse({ status: 200, description: 'Fields retrieved successfully', type: [FieldsDto] })
  async findAll(
    @Query('name') name?: string,
    @Query('location') location?: string,
    @Query('sportType') sportType?: string,
    @Query('sportTypes') sportTypes?: string | string[],
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('radius') radius?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ): Promise<FieldsDto[]> {
    // Convert sportTypes to array if it's a string
    const sportTypesArray = sportTypes
      ? (Array.isArray(sportTypes) ? sportTypes : [sportTypes])
      : undefined;

    return this.fieldsService.findAll({
      name,
      location,
      sportType,
      sportTypes: sportTypesArray,
      latitude,
      longitude,
      radius,
      sortBy,
      sortOrder,
    });
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby fields within specified radius (Public)' })
  @ApiResponse({ status: 200, description: 'Nearby fields retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid coordinates or radius' })
  async findNearbyFieldsPublic(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
    @Query('limit') limit?: number,
    @Query('sportType') sportType?: string,
    @Query('name') name?: string,
    @Query('location') location?: string,
  ) {
    if (!lat || !lng) {
      throw new BadRequestException('lat and lng parameters are required');
    }

    if (lat < -90 || lat > 90) {
      throw new BadRequestException('Latitude must be between -90 and 90 degrees');
    }

    if (lng < -180 || lng > 180) {
      throw new BadRequestException('Longitude must be between -180 and 180 degrees');
    }

    const searchRadius = radius || 10;
    if (searchRadius <= 0 || searchRadius > 100) {
      throw new BadRequestException('Radius must be between 1 and 100 kilometers');
    }

    const resultLimit = limit || 20;
    if (resultLimit <= 0 || resultLimit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    return this.fieldsService.findNearbyFieldsPublic(lat, lng, searchRadius, resultLimit, sportType, name, location);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get field by ID' })
  @ApiParam({ name: 'id', description: 'Field ID' })
  @ApiResponse({ status: 200, description: 'Field retrieved successfully', type: FieldsDto })
  @ApiResponse({ status: 400, description: 'Invalid field ID format' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  async findOne(@Param('id') id: string): Promise<FieldsDto> {
    // Validate ObjectId format to prevent CastError
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid field ID format: "${id}". Field ID must be a valid MongoDB ObjectId.`);
    }
    return this.fieldsService.findOne(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get field availability for date range' })
  @ApiParam({ name: 'id', description: 'Field ID' })
  @ApiResponse({ status: 200, description: 'Field availability retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid field ID format or date range' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  async getAvailability(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    // Validate ObjectId format to prevent CastError
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid field ID format: "${id}". Field ID must be a valid MongoDB ObjectId.`);
    }
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    if (start > end) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    return this.fieldsService.getFieldAvailability(id, start, end);
  }

  @Get(':id/amenities')
  @ApiOperation({ summary: 'Get field amenities' })
  @ApiParam({ name: 'id', description: 'Field ID' })
  @ApiResponse({ status: 200, description: 'Field amenities retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid field ID format' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  async getFieldAmenities(@Param('id') fieldId: string) {
    // Validate ObjectId format to prevent CastError
    if (!Types.ObjectId.isValid(fieldId)) {
      throw new BadRequestException(`Invalid field ID format: "${fieldId}". Field ID must be a valid MongoDB ObjectId.`);
    }
    return this.fieldsService.getFieldAmenities(fieldId);
  }
}

